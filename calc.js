// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions_and_function_scope/Strict_mode
"use strict"

// This JQuery pattern ( $(function() {...}); ) creates an anonymous function that
// will run when the entire html DOM has been loaded.
$(function() {
    var acc, reg, op, err, decimal
    
    // Clear the calculator.
    function clear() {
        op = '';
        err = false;
        clearAcc();
        
        $('#display').val(acc);
    }

    // Clear the accumulator.
    function clearAcc() {
        acc = 0;
        decimal = false;
    }

    // Process the click of a "number" button.
    function numberClick() {
        var num = $(this).val();

        if (err) {
            clear();
        }

        if (num == '.') {
            if (decimal) {
                return;
            }

            decimal = true;
        }
        
        if (acc == 0) {
            if (num == 0) {
                return;
            }

            if (num != '.') {
                acc = num;
                num = '';
            }
        }

        acc += num;
        $('#display').val(acc);
    }

    // Process the click of an operator button.
    function opClick() {
        switch ($(this).val()) {
        case 'C':
            clear();
            break;

        case '=':
            calc();
            break;

        default:
            op = $(this).val();
            reg = acc;
            clearAcc();
            break;
        }
    }

    // Perform the calculation specified by the saved op.
    function calc() {
        switch (op) {
        case '*':
            reg = reg * acc;
            break;

        case '/':
            if (parseFloat(acc) == 0) {
                reg = 'Divide by zero.';
                err = true;
                break;
            }

            reg = reg / acc;
            break;

        case '+':
            reg = parseInt(reg) + parseInt(acc);
            break;

        case '-':
            reg = reg - acc;
            break;

        default:
            reg = acc;
            break;
        }

        $('#display').val(reg);
    }

    // Bind numberClick() function to "onclick" event for any element with the "numberButton" class.
    $('.numberButton').on('click', numberClick);

    // Bind opClick() function to "onclick" event for any element with the "opButton" class.
    $('.opButton').on('click', opClick);

    clear();
});

