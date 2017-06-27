//<!--
"use strict"

/*  Validator Object
 *
 *  The Validator object provides client-side, user input validation. In addition to several 
 *  common "canned" validations - e.g. required fields, date fields, etc. - Validator can
 *  use custom validation functions provided by the programmer. Validator can manage submission 
 *  buttons so that submission actions can be intercepted or disabled when validation errors
 *  exist. If submission buttons are already wired into other event handlers, the pre-submission
 *  validation can be called manually - Validator.isValid(true) - in the existing event handler.
 *  In addition to visual results, Validator automatically inserts aria attributes and 
 *  elements to report validation results.
 *
 *  Multiple Validators can be instantiated on a single page - e.g. separate validators for
 *  multiple, pop-up modal divs. Each validator is "scoped" to a section of the DOM via the first
 *  parameter to the constructor, scopeSelector. scopeSelector is a JQuery selector that will select
 *  a single DOM element - usually a div. All validations for a validator are limited to items within
 *  the selected scope.
 *
 *  Basic usage:
 *  For a view/page to use the validation system:
 *    1.  Add any of the "automatic" validation classes to your DOM elements as appropriate. For 
 *        example, add class="valRequired" to required fields. Note, however, that if you wish
 *        to add/remove validations at run-time, then you should not use the "automatic" validations.
 *        Instead, you will add validations programmatically.
 *    2.  Instantiate a Validator (validator) after DOM is loaded - typically in a "document
 *        ready" function - e.g. validator = new Validator(params).
 *    3.  Add a "targets" to your validator by calling validator.addTarget(params). Targets are the
 *        input elements you wish to validate. When adding a target, one can optionally specify an
 *        "indicator" element. The indicator element is the html element next to which the target's
 *        validation icons will be displayed. If the indicator is not specified in the call to addTarget,
 *        the validator will search for a suitable element in the following order:
 *        a. A label element with its "for" attribute equal to the target's id.
 *        b. The first label within the same form-group as the target.
 *        c. The target itself.
 *    4.  Add validations to your target via target.addValidation(params). Note that addValidation
 *        also specifies the "trigger" - the control and events that trigger a validation - and the
 *        validation function. This allows you to trigger a validation function F on control A (the
 *        target) when event B occurs on control C (the trigger).
 *    4.  To run an overall validation after all other validations have run, assign
 *        your overall validation function to validator.postValidation. Your post-validation
 *        function should take a single bool parameter. This parameter will be passed-in
 *        as false when any validations have failed so that your post validator can
 *        perform different action depending on whether all other validation have passed.
 *    5.  JQuery does not fire the change event on a control when the control's value is changed - 
 *        i.e. $(selector).val('foo') will not fire the change event. Since validations are wired
 *        into, typically, the change and/or keyup events, you will have to programmatically call
 *        control.change() after calling control.val(newvalue) in order to trigger the validation(s)
 *        on control. Alternatively, when setting a number of controls - e.g. when loading a modal
 *        editor with the values to be edited - you can simply call validator.validateAll(false) to
 *        validate all of the data you just loaded into the controls.
 *
 *  Automatic Validations:
 *  Several validations are automatically added to any view which instantiates a Validator.
 *  These automatic validations are added for controls that contain one of the validation classes.
 *  See the automatic validations in the Validator constructor for the class names that are used.
 */

/*  Validator Object
 *   This is the main validation object used to add validation to a view.
 *   +  scopeSelector is the (jquery) selector for the container(s) that contains all of the
 *      controls validated by this NGValidation object. If the scope selector finds multiple
 *      DOM elements, scope is defined as the union of those elements' content. If the scope 
 *      selector finds no elements, the document will serve as the container.
 *   +  validationBehavior tells the validator how to highlight validation errors as they occur.
 *      +  ValidateEnum.NONE: Run validation functions and set aria attributes, but do not 
 *         visually display any validation results.
 *      +  ValidateEnum.ICON: Add the validation icons to the indicator control. The icons can 
 *         be overridden by assigning new values to the items in validator.IconEnum. The color of
 *         the icons can be overridden by assigning new values to the items in validator.ColorEnum.
 *      +  ValidateEnum.HIGHLIGHT: Add a class to the control being validated: HighlightEnum.FAIL
 *         for validation failures (default value for HighlightEnum.FAIL is bootstrap's alert-danger,
 *         HighlightEnum.WARN for warnings (default: bootstrap's alert-warn), remove both of these 
 *         on success. The default highlight colors can be overridden by assigning new values to the 
 *         items in validator.HighlightEnum.
 *      +  ValidateEnum.HELP: make the aria help text visiable.
 *   +  submitSelector is the optional (jquery) selector for the submit button that will be 
 *      managed according to validation results. When ommitted, Validator will attempt to
 *      add submit button management (as per submitBehvaior) to any :submit button within scope.
 *   +  submitBehavior optionally tells the validator how to manage submit buttons within scope.
 *      +  SubmitEnum.NONE: the submit button is not directly managed by Validator - this 
 *         is often necessary when the submit button already has other event handlers because
 *         javascript (and jquery) do not provide a reliable, standardized method for setting
 *         handler order. Because event handlers are called in the order in which they were
 *         registered, it can be difficult to get Validator's submit handler to fire before
 *         other handlers. In such a case, one can instruct Validator not to use its handler
 *         and the programmer can manually insert a call to validator.isValid() within the 
 *         submit button's regular handler.
 *      +  SubmitEnum.ICON: Display the validation icon next to target's indicator control.
 *      +  SubmitEnum.HIGHLIGHT: Add a background color to fields with a validation error 
 *         upon submission. Colors can be overridden.
 *      +  SubmitEnum.HELP: Make the validation error messages visible upon submission.
 *      +  SubmitEnum.SUMMARY: Display a summary of validation errors if they exist.
 *      +  SubmitEnum.DISABLE: Disable the submit button when validation errors exist.
 *         
 *   Example instantiation:
 *      myValidator = new Validator(
 *          // the element with id="ProjectObjectivesModal" is the container for all controls validated by this validator
 *          '#ProjectObjectivesModal', 
 *          // the validation icon is the only visual indicator while users are typing into the controls
 *          Validator.prototype.ValidateEnum.ICON, 
 *          // don't manage the submit button(s)
 *          undefined, 
 *          // if the programmer calls isValid, the icon, help text and background color highlight will be applied
 *          Validator.prototype.SubmitEnum.ICON | Validator.prototype.SubmitEnum.HELP | Validator.prototype.SubmitEnum.HIGHLIGHT
 *      );
 *********************************************************************************/ 
function Validator(scopeSelector, validationBehavior, submitSelector, submitBehavior) {
    // IE running under compat view or older versions do not support string.trim so add it.
    if (typeof String.prototype.trim !== 'function') {
        String.prototype.trim = function () {
            return this.replace(/^\s+|\s+$/g, '');
        }
    }

    var self = this;

    self.scope = $(scopeSelector);
    if (self.scope.length == 0) {
        self.scope = $(document);
    }

    self.targets = {};
    self.validationBehavior = validationBehavior;
    self.submitBehavior = submitBehavior;

    self.submitButtons = self.scope.find(submitSelector);
    if (self.submitButtons.length > 0) {
        if (self.submitBehavior == this.SubmitEnum.SUMMARY) {
            self.submitButtons.each(function () {
                $(this).on('click', function (event) {
                    return self.isValid(event);
                });
            });
        }
    }

    // If the page has a reset button, re-run all validations when it is clicked.
    self.scope.find(':reset').on('click', function () {
        self.scope.find('form')[0].reset();
        for (var c in self.targets) {
            self.targets[c].clear();
        }
    });

    // Automatic Validations:
    // Add RequiredValidator to all controls within scope that have the valRequired class.
    self.scope.find('.valRequired').each(function () {
        self.require(this);
    });

    // Add DateValidator to all controls within scope that have the valDate class.
    self.scope.find('.valDate').each(function () {
        self.addTarget(this).
            addValidation(this, ['keyup', 'change'], self.Validator_Date);
    });

    // Add EMailValidator to all controls within scope that have the valEMail class.
    self.scope.find('.valEMail').each(function () {
        self.addTarget(this).
            addValidation(this, ['keyup', 'change'], self.Validator_EMail);
    });

    // Perform a full validation on instantiation.
    self.validateAll(false);
}

Validator.prototype = {
    constructor: Validator,

    StateEnum: Object.freeze({ PASS: 0, WARN: 1, FAIL: 2 }),
    SubmitEnum: Object.freeze({ NONE: 0, ICON: 1, HIGHLIGHT: 2, HELP: 4, SUMMARY: 8, DISABLE: 16 }),
    ValidateEnum: Object.freeze({ NONE: 0, ICON: 1, HIGHLIGHT: 2, HELP: 4 }),

    // Because these enumerations are in the prototype, changing any of these values changes the value
    // for all instances. These could be moved to the constructor if one wanted to override any of these
    // values only for a single instance.
    IconEnum: Object({ PASS: 'glyphicon-ok', FAIL: 'glyphicon-remove', WARN: 'glyphicon-warning-sign'}),
    HighlightEnum: Object({ PASS: '', FAIL: 'alert-danger', WARN: 'alert-warn' }),
    ColorEnum: Object({ PASS: 'green', FAIL: 'red', WARN: 'gold' }),

    /* If validation errors exist within scope, display a summary
     * and stop propagation of the trigerring event
     * event: the event triggering this submission.
     */
    isValid: function (event) {
        this.validateAll(true);

        // If any validations failed.
        if (this.state() & this.StateEnum.FAIL) {
            if (event !== undefined) {
                event.stopImmediatePropagation();
                event.preventDefault();
            }

            this.displayAllErrors();
            return false;
        }

        return true;
    },

    displayAllErrors: function () {
        var message = 'Please correct all validation errors on this page before submitting.<br><br><ul>';

        this.scope.find('.help-block').each(function () {
            var localMessage = $(this).html().replace(/\n/g, '<br>').replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
            if (!isEmpty(localMessage)) {
                message += "<li>" + localMessage + "</li>";
            }
        });
    
        this.displayInPopup('Validation Errors', message + "</ul>");
    },

    displayInPopup: function (title, message) {
        $('#ValidatorModal').remove();

        $("body").append(
            '<section class="modal" id="ValidatorModal" tabindex="-1" role="dialog" aria-hidden="true" data-backdrop="static">' +
            '    <div class="modal-dialog modal-sm">' +
            '        <div class="modal-content">' +
            '            <div class="modal-header">' +
            '                <button type="button" class="close" data-dismiss="modal">&times;</button>' +
            '                <h4 class="modal-title modalMessage">' + title + '</h4>' +
            '            </div>' +
            '            <div class="modal-body">' +
            '                <div class="modalResults">' +
            '                    <div class="modalResultsMessage">' + message + '</div>' +
            '                    <div class="text-right">' +
            '                        <input type="button" value="OK" class="btn btnModalOK" data-dismiss="modal" />' +
            '                    </div>' +
            '                </div>' +
            '            </div>' +
            '        </div>' +
            '    </div>' +
            '</section>'
        );

        $('#ValidatorModal').modal('show');
    },

    /*  Add a validation target.
     *  targetControl - the html element whose data is to be validated.
     *  name - optional "friendly" name
     *  indicatorControl - optional html element next to which the indicator will be displayed
     */
    addTarget: function (targetControl, name, indicatorControl) {
        var targetId = targetControl.id || targetControl.name;

        // Does this Validator already contain a matching target?
        if (this.targets[targetId] === undefined) {
            debug('\tAdding new target for ' + targetId + '.');
            this.targets[targetId] = new ValidationTarget(this, targetControl, name, indicatorControl);
        }
        else {
            debug('\tFound existing target for ' + targetId + '.');
        }
        
        // return the new target so that users can function chain
        return this.targets[targetId];
    },

    /*  Make an element required at run-time.
    */
    require: function (targetControl, name, indicatorControl) {
        this.addTarget(targetControl, name, indicatorControl).
            addValidation(targetControl, ['keyup'], this.Validator_Required).
            addValidation(targetControl, ['change'], this.Validator_Required);
            
        $(targetControl).change();
    },


    /*  Make an element not-required at run-time.
    */
    unRequire: function (targetControl, indicatorControl) {
        debug('Unrequiring ' + targetControl.id);
        this.removeControlFunction(targetControl, targetControl, ['keyup', 'change'], this.Validator_Required);
    },

    /*  Remove a validation function from a control validator and remove the control validator if there are no more functions.
    *   +   targetControl - the control whose data is to be validated.
    *   +   triggerControl - the control whose event triggers a validation.
    *   +   events - the events to deregister
    *   +   vf - the validation functions to deregister
    */
    removeControlFunction: function (targetControl, triggerControl, events, vf) {
        var targetId = targetControl.id || targetControl.name;

        var target = this.targets[targetId];
        if (target !== undefined) {
            target.removeValidation(triggerControl, events, vf)
            if (Object.size(target.validations) == 0) {
                target.clear();
                $(target.indicator).remove();
                delete this.targets[targetId];
            }
        }
    },

    /*  Returns the cumulative state of validity of all targets in this Validator.
    */
    state: function () {
        var s = this.StateEnum.PASS;
        
        for (var t in this.targets) {
            s |= this.targets[t].state;
        }

        return s;
    },


    /*  Run all ValidationFunctions for all targets.
    */
    validateAll: function (submitting) {
        for (var t in this.targets) {
            this.targets[t].validateAll(submitting);
            debug("Target " + this.targets[t].name + ", state: " + this.targets[t].state);
        }

        this.post();
    },

    post: function() {
        var hasFailures = (this.state() & this.StateEnum.FAIL) != this.StateEnum.FAIL;
        if (this.postValidation) {
            debug("Calling postvalidation");
            this.postValidation(hasFailures);
        }

        if (this.submitBehavior == this.SubmitEnum.DISABLE) {
            if (hasFailures) {
                this.submitButtons.addClass('disabled');
            }
            else {
                this.submitButtons.removeClass('disabled');
            }
        }
    },

   
    /* Validation functions: all validation functions generally start with the word
     * "Validator" and are instantiated via new Validator_Function(name, func (target)).
     */
    
    /* Validate a date.
    */
    Validator_Date: new ValidationFunction('Validator_Date', function (target) {
        var t = $(target.control);
        var dt = t.val();

        if (!isEmpty(dt)) {
            var window = t.attr('date-window');
            if (!isDate(dt, window)) {
                target.fail(target.name + ', ' + dt + ' is not a date.');
            }
            else if (!/^([1-9]|0[1-9]|1[012])[-\/]([1-9]|0[1-9]|[12][0-9]|3[01])[-\/](\d\d|(19|20)\d\d$)/.test(dt.toString())) {
                target.fail(target.name + ' is not a validly formatted date. Use mm/dd/yyyy.');
            }
        }
    }),


    /* Comparators for sequence comparisons.
     */
    Sequence_LT: new ValidationFunction('less than', function (v1, v2) {
        return v1 < v2;
    }),

    Sequence_GT: new ValidationFunction('greater than', function (v1, v2) {
        return v1 > v2;
    }),

    Sequence_LTEQ: new ValidationFunction('less than or equal to', function (v1, v2) {
        return v1 <= v2;
    }),

    Sequence_GTEQ: new ValidationFunction('greater than or equal to', function (v1, v2) {
        return v1 >= v2;
    }),

    Sequence_EQ: new ValidationFunction('equal to', function (v1, v2) {
        return v1 == v2;
    }),

    Sequence_NEQ: new ValidationFunction('not equal to', function (v1, v2) {
        return v1 != v2;
    }),


    /* Produce validator function to validate the sequence of two dates.
     * The target control specified when instantiating a control validator contains date 1.
     * laterDate is the control that contains date 2.
     * nameLaterDate contains the name of the later date.
     * fnDateComparator is one of the Sequence_???? functions (above).
    */
    Validator_DateSequence_Factory: function (laterDate, nameLaterDate, fnDateComparator) {
        return new ValidationFunction('Validator_Date_' + fnDateComparator.name + '_' + nameLaterDate, function (target) {
            var t = $(target.control);
            var dt1 = t.val();
            var window = t.attr('date-window');
            var dt2;
            if (typeof laterDate == 'function') {
                dt2 = laterDate();
            }
            else {
                dt2 = laterDate;
            }

            if (!isEmpty(dt1) && !isEmpty(dt2)) {
                if (isDate(dt1, window) && isDate(dt2, window)) {
                    dt1 = new Date(dt1);
                    dt2 = new Date(dt2);
                    if (!fnDateComparator.method(dt1, dt2)) {
                        target.fail(target.name + ' must be ' + fnDateComparator.name + ' ' + nameLaterDate + '.');
                    }
                }
            }
        });
    },


    /* Left this in here to show how a complex validator can perform an ajax lookup 
     * as part of its validation. This was a "canned" validation from an old project
     * that was automatically added to every page of a system - that's why such a 
     * specific validation was embedded within the validation object.
     */
    Validator_SSID: new ValidationFunction('Validator_SSID', function (target) {
        var ssid = $(target.control).val();

        if (ssid.length == 0) {
            return;
        }

        if (ssid.length != 6) {
            target.fail('SSIDs must be six characters in length.');
        }
        else {
            var p = new Object;
            p.ProcessType = 'ssidlookup';
            p.SSID = ssid;

            $.ajax({
                type: 'POST',
                url: '/NGSDev/fa_facilityadd.asp',
                data: p,
                success: function (data) {
                    var info = $.parseJSON(data);
                    if (info.schoolname) {
                        $(target.control).attr('title', info.districtname + '\n' + info.schoolname + "\n" + info.add1 + "\n" + info.add2 + "\n" + info.city + ", " + info.state + " " + info.zip);
                        if (!info.active) {
                            target.warn(ssid + ' is not an active facility.');
                        }
                    }
                    else {
                        target.fail(ssid + ' does not exist on NGS.');
                    }
                },
                async: false
            });
        }
    }),


    /* Validate format of an email address (can contain multiple, semicolon separated addresses).
     */
    Validator_EMail: new ValidationFunction('Validator_EMail', function (target) {
        var patt = /^([_a-zA-Z0-9-]+)(\.[_a-zA-Z0-9-]+)*@([a-zA-Z0-9-]+)(\.[a-zA-Z0-9-]+)*(\.[a-zA-Z]{2,4})$/;
        var email = $(target.control).val();

        if (email.indexOf(';') != -1) {
            email = email.split(';');
            for (var i = 0; i < email.length; i++) {
                if (!patt.test(email[i].trim())) {
                    target.fail(email[i].trim() + ' is not a valid email address.');
                }
            }
            return;
        }

        if (!isEmpty(email)) {
            if (email.trim && !patt.test(email.trim())) {
                target.fail(email.trim() + ' is not a valid email address.');
            }
        }
    }),


    /* Validate that a required field has a value.
     */
    Validator_Required: new ValidationFunction('Validator_Required', function (target) {
        if (target.control.tagName == 'SELECT') {
            if (isEmpty($(target.control).children(':selected').text())) {
                target.fail(target.name + ' is a required field.');
            }
        }
        else if (isEmpty($(target.control).val())) {
            target.fail(target.name + ' is a required field.');
        }
    }),


    /* A factory for length validators.
     */
    Validator_Length_Factory: function (requiredLength) {
        return new ValidationFunction('Validator_Length_' + requiredLength, function (target) {
            var d = $(target.control).val();
            if (!isEmpty(d) && d.length != requiredLength) {
                target.fail(target.name + ' must be ' + requiredLength + ' characters in length.');
            }
        });
    },


    /* A phone number format validator.
     */
    Validator_Phone: new ValidationFunction('Validator_Phone', function (target) {
        var pn = $(target.control).val();
        if (isEmpty(pn)) {
            return;
        }

        var valid = false;

        // 999-999-9999
        valid |= /^\d\d\d-\d\d\d-\d\d\d\d$/.test(pn);

        // 999-999-9999 x 9000
        valid |= /^\d\d\d-\d\d\d-\d\d\d\d x \d{1,}$/i.test(pn);

        if (!valid) {
            target.fail('The phone number must include an area code and must conform to one of the following formats:\n\t999-999-9999\n\t999-999-9999 x 9000.');
        }
    }),

    close: function () {
        for (var t in self.targets) {
            self.targets[t].close();
        }
    }
};


/* ValidationTarget Object
 * A ValidationTarget assembles a set of controls involved in a validation
 * and a list of events which trigger validations. Each of these events
 * links to a list of ValidationFunctions which should be invoked when the
 * event occurs.
 *********************************************************************************/
function ValidationTarget(validator, targetControl, name, indicatorControl) {
    // Ref back to the containing Validator
    this.Validator = validator;

    // The target control is the controls whose data will be validated.
    this.key = targetControl.id || targetControl.name;
    this.control = targetControl;
    
    this.indicator = indicatorControl;
    if (this.indicator === undefined) {
        this.indicator = this.Validator.scope.find('label[for="' + this.control.id + '"]');
        if (this.indicator.length != 0) {
            this.name = this.indicator.html().replace(':', '');
        }
    }
    if (this.indicator === undefined || this.indicator.length === 0) {
        this.indicator = $(this.control).parents('.form-group').find('label');
    }
    if (this.indicator === undefined || this.indicator.length === 0) {
        this.indicator = $(this.control);
    }

    this.name = name || this.name || targetControl.name || targetControl.id;
    this.state = validator.StateEnum.PASS;
    this.messages = [];
    this.validations = {};
}

/* ValidationTarget prototype.
  *********************************************************************************/
ValidationTarget.prototype = {
    constructor: ValidationTarget,

    // Optional "submitting" indicates this check is prior to submitting data and will trigger 
    // additional visual indicators. This is the netry point for manually validating a target.
    validateAll: function (submitting) {
        this.clear();

        var disabledAncestor = $(this.control).parents('.disabled');
        if (disabledAncestor.length == 0) {
            for (var v in this.validations) {
                if (!this.validations[v].lock) {
                    this.validations[v].lock = true;
                    this.validations[v].method(this);
                    this.validations[v].lock = false;
                }
            }

            for (var v in this.validations) {
                this.validations[v].lock = false;
            }

            this.setValidationResults(submitting);
        }
    },
    
    // This is the event handler that is called when the trigger event occurs on the trigger control.
    validate: function (event) {
        var target;
        if (event) {
            target = event.data.target;
        }
        else {
            target = this;
        }

        target.validateAll(false);
        target.Validator.post();
    },

    /* Sets the results of validating this target. When submitting is true,
    *  use the configured submission behaviors.
    */
    setValidationResults: function (submitting) {
        // reference to the target control
        var control = $(this.control);
        if (control.length == 0) {
            return;
        }
        
        // the aria-describedby help block
        var describedBy = control.attr('aria-describedby');
        var help;
        if(describedBy !== undefined){
            help = $('#' + describedBy);
        }

        if (help === undefined || help.length === 0) {
            help = control.parent().find('.help-block');
        }

        if (help === undefined || help.length === 0) {
            // no help block found - create one
            // TODO: Displaying the helpblock is problematic. Normal html flow-control 
            // collides with bootstrap layout and the helpblock may not appear where
            // expected unless it was created as part of the original markup. Until this
            // is resolved, it may be better not to show the helpblock and allow it to 
            // function - as intended - as an aria element for screen readers.
            // A possible approach to fix the display is to wrap the validated control 
            // in a container so that the help block to aligns with the validated control:
            // control.wrap('<div style="display:table;"></div>');
            // But this doesn't work in all cases.
            var helpId = control[0].id + '-autohelpblock';
            control.parent().append('<label id="' + helpId + '" class="help-block hidden" style=";font-size:x-small;"></lable>');
            help = $('#' + helpId);
        }

        control.attr('aria-describedby', help[0].id);

        // clear prior validation results
        control.prop('aria-invalid', false);
        for (var c in this.Validator.HighlightEnum) {
            if (this.Validator.HighlightEnum.hasOwnProperty(c)) {
                control.removeClass(this.Validator.HighlightEnum[c]);
            }
        }
        help.html('');
        help.addClass('hidden');
        this.indicator.children('.validationIndicator').remove();
        
        if (this.state == this.Validator.StateEnum.PASS) {
            // hide indicator for blank fields that have passed validation.
            if (this.control.tagName == 'SELECT') {
                if (isEmpty(control.children(':selected').text())) {
                    return;
                }
            }
            else if (isEmpty($(this.control).val())) {
                return;
            }
        }

        // Display of the visual result indicators behaves differently depending upon whether
        // this update is part of a final pre-submission validation (submit == true) or the
        // regular update after making a change to the control being validated (submit == false).
        var relevantBehavior;
        var relevantEnum;
        if (submitting) {
            relevantBehavior = this.Validator.submitBehavior;
            relevantEnum = this.Validator.SubmitEnum;
        }
        else {
            relevantBehavior = this.Validator.validationBehavior;
            relevantEnum = this.Validator.ValidateEnum;
        }

        // Make help text visible?
        help.html(this.fullMessage());
        if ((relevantBehavior & relevantEnum.HELP) == relevantEnum.HELP) {
            help.removeClass('hidden');
        }
        else {
            help.addClass('hidden');
        }

        // Display an icon?
        if ((relevantBehavior & relevantEnum.ICON) == relevantEnum.ICON) {
            var icon = $('<span class="glyphicon validationIndicator" style="margin-left:1em;" aria-hidden="true" title="' + this.fullMessage() + '"></span>');
            var iconClass;
            var iconColor;

            // TODO: should be able to get rid of this if block by indexing into IconEnum and
            // ColorEnum with this.state.
            if (this.state == this.Validator.StateEnum.PASS) {
                iconClass = this.Validator.IconEnum.PASS;
                iconColor = this.Validator.ColorEnum.PASS;
            }
            else if (this.state == this.Validator.StateEnum.WARN) {
                iconClass = this.Validator.IconEnum.WARN;
                iconColor = this.Validator.ColorEnum.WARN;
            }
            else {
                iconClass = this.Validator.IconEnum.FAIL;
                iconColor = this.Validator.ColorEnum.FAIL;
            }

            icon.addClass(iconClass);
            icon.css({ color: iconColor });
            this.indicator.append(icon);
        }

        // Add a highlight?
        if ((relevantBehavior & relevantEnum.HIGHLIGHT) == relevantEnum.HIGHLIGHT) {
            if (this.state == this.Validator.StateEnum.WARN) {
                control.addClass(this.Validator.HighlightEnum.WARN);
            }
            else if (this.state == this.Validator.StateEnum.FAIL) {
                control.addClass(this.Validator.HighlightEnum.FAIL);
            }
            else {
                control.addClass(this.Validator.HighlightEnum.PASS)
            }
        }
    },


    /* Add message to message list if not already present.
    */
    addMessage: function (message) {
        var addIt = true;
        
        // check for duplication of message
        for (var i = 0; i < this.messages.length; i++) {
            if (this.messages[i] == message) {
                addIt = false;
                break;
            }
        }

        if (addIt) {
            this.messages.push(message);
        }
    },


    /* This is the function that a ValidationFunction must use
    * to indicate a validation failure.
    */
    fail: function (message) {
        debug("Fail: " + message);
        this.state |= this.Validator.StateEnum.FAIL;
        $(this.control).attr("aria-invalid", "true");
        this.addMessage('Error: ' + message);
    },

    /* This is the function that a ValidationFunction must use
    * to indicate a validation warning.
    */
    warn: function (message) {
        this.state |= this.Validator.StateEnum.WARN;
        this.addMessage('Warning: ' + message);
    },

    /* Assembles all ValidationFunction messages for this ValidationTarget.
    */
    fullMessage: function () {
        var m = '';

        for (var i = 0; i < this.messages.length; i++) {
            if (m.length) {
                m += '\n';
            }
            m += this.messages[i];
        }

        return m;
    },


    /* Reset a ValidationTarget.
    */
    clear: function () {
        this.state = this.Validator.StateEnum.PASS;
        $(this.control).attr("aria-invalid", "false");
        this.messages = [];
        this.setValidationResults(false);
    },

    close: function(){
        // TODO: delete all functions and unwire all DOM events.
        // This isn't currently used, but would be needed if validators
        // are ever to be instantiated and deleted multiple times during
        // the lifetime of a single page.
    },

    /* Add a ValidationFunction to this ValidationTarget to be invoked
    * on the given events.
    */
    addValidation: function (triggerControl, events, vf) {
        var triggerId = (triggerControl.id || triggerControl.name);
        var v = this.validations[vf.name];
        if (v === undefined) {
            debug('\tAdding ' + vf.name + ' for' + this.name);
            this.validations[vf.name] = {
                lock: false,
                refCount: {},
                method: vf.method
            };
            v = this.validations[vf.name];
        }

        for (var i = 0; i < events.length; i++) {
            var eventId = triggerId + '.' + events[i];
            if (v.refCount[eventId] === undefined) {
                debug('\tTriggering ' + vf.name + ' on ' + eventId + ' for' + this.name);
                v.refCount[eventId] = 1;
                $(triggerControl).on(events[i], { target: this }, this.validate);
            }
            else {
                v.refCount[eventId]++;
            }
        }

        return this;
    },

    /* Remove a ValidationFunction from this ValidationTarget for
    * the given events.
    */
    removeValidation: function (triggerControl, events, vf) {
        var triggerId = triggerControl.id || triggerControl.name;
        var v = this.validations[vf.name];
        if (v) {
            for (var i = 0; i < events.length; i++) {
                var eventId = triggerId + '.' + events[i];
                v.refCount[eventId]--;
                if (v.refCount[eventId] < 1) {
                    // No more triggers to vf from triggerControl.events[i], kill the DOM event
                    $(triggerControl).off(events[i], this.validate);
                    delete v.refCount[eventId];
                }
            }

            if (Object.size(v.refCount) == 0) {
                // No more references, delete the validation function.
                debug('\tDeleting ' + vf.name);
                delete this.validations[vf.name];
            }
        }

        this.validate();
    }
};

// TODO: pull these functions into Validator or other object as appropriate

/* ValidationFunction object
  * Packages a function (that performs some sort of validation) with a 
name property.
  ************************************************************************************/
function ValidationFunction(name, f) {
    this.name = name;
    this.method = f;
}

/* misc. helper functions
  ************************************************************************************/
Object.size = function (obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

var NGValidationDebug = false;
function debug(message) {
    if (NGValidationDebug) {
        console.log('DEBUG: ' + message);
    }
}

// Indicates if a variable is empty or null
function isEmpty(inputStr){
    var str = new String(inputStr).trim();
    return str === null || str === "";
}

// Returns True for inputs which are valid dates.
// Javascript is very liberal when interpreting dates.  For example, 1/41/2015
// (January 41st, 2015) is interpreted as 2/10/2015 because 41 is 10 more than
// the last day of January.  Any simple Javascript test of the string '1/41/2015'
// will indicate that it is a valid date (because 2/10/2015 is a valid date) so
// we need a slightly more complicated test.
//
// The slightly more complicated test (below) verifies that the month, day, and
// year extracted from the original string match the month, day, and year
// extracted from the Date object initialized from that same string.
//
// Using our prior example string of '1/41/2015' and the Date object created from
// it (2/10/2015), we see that the month and day values do not match and conclude
// that the original string does not express a valid date.
function isDate(data, window) {
    var rx = /^(\d+)[-\/](\d+)[-\/](\d+)$/

    // if the date matches a basic number/number/number format
    if (rx.test(data)) {
        var originalParts = {};
        normalizeDate(data, rx, window, originalParts);

        // instantiate a date object
        var dt = new Date(originalParts.mdy);

        // if it successfully created a date object
        if ((dt != 'Invalid Date') && !isNaN(dt)) {
            // extract the pieces from the date object
            var m2 = dt.getMonth() + 1;
            var d2 = dt.getDate();
            var y2 = dt.getFullYear();

            // return results of comparison
            return originalParts.m == m2 && originalParts.d == d2 && originalParts.y == y2;
        }
    }

    // if anything failed, it's not a valid date
    return false;
}

function normalizeDate(data, rx, window, parts) {
    // if no window is defined, use 50
    try {
        window = parseInt(window);
    }
    catch (e) {
        window = 50;
    }
        
    // extract the pieces from the original string
    var found = data.match(rx);
    if (found) {
        parts.m = parseInt(found[1]);
        parts.d = parseInt(found[2]);
        parts.y = parseInt(found[3]);

        // apply the window
        if (parts.y < window) {
            parts.y += 2000
        }
        else if (parts.y < 100) {
            parts.y += 1900
        }

        parts.mdy = parts.m + '/' + parts.d + '/' + parts.y;
    }
}
//-->>


