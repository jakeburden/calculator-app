var ui = {
  expression: document.querySelector('[data-ui-component="expression"]'),
  result: document.querySelector('[data-ui-component="result"]'),
  tokens: document.querySelectorAll('[data-token]'),
  delete: document.querySelector('[data-ui-component="delete"'),
  clear: document.querySelector('[data-ui-component="clear"')
}

var state = {
  expression: '',
  result: '',
  splitExpression: []
}

;[].forEach.call(ui.tokens, function (el) {
  el.addEventListener('click', function (e) {
    var token = e.target.getAttribute('data-token')
    state.expression += token
    update()
  })
})

ui.delete.addEventListener('click', backspace)
ui.clear.addEventListener('click', clear)

window.addEventListener('keyup', function (e) {
  var operationKeys = [
    187, // add
    189, // subtract
    190, // period
    191, // divde ("slash")
    107, // keypad add
    109, // keypad subtract
    106, // keypad multiply
    111  // keypad divide
  ]

  var operators = ['+', '-', '*', '/', '^', '(', ')', '.']

  // numbers and several operation keys
  if (e.keyCode >= 48 && e.keyCode <= 57) {
    if (isNaN(Number(e.key)) && operators.indexOf(e.key) === -1) return
    state.expression += e.key
    update()
  }

  if (operationKeys.indexOf(e.keyCode) > -1) {
    if (isNaN(Number(e.key)) && operators.indexOf(e.key) === -1) return
    state.expression += e.key
    update()
  }

  // "c" or "C" keys
  if (e.keyCode === 67 || e.keyCode === 99) clear()

  // left arrow or delete key
  if (e.keyCode === 37 || e.keyCode === 8) backspace()
})

function update () {
  ui.expression.textContent = state.expression
  state.splitExpression = state.expression.match(/[^\d()]+|[()]+|[\d.]+/g) || []
  var lastToken = state.splitExpression[state.splitExpression.length - 1]
  var secondToLastToken = state.splitExpression[state.splitExpression.length - 2]
  var tmp

  // don't do anything if we are missing an expression
  if (!state.splitExpression) {
    return
  }

  if (secondToLastToken === '.') {
    tmp = state.splitExpression.pop()
    state.splitExpression.pop()
    state.splitExpression.push('0.' + tmp)
  }

  if (secondToLastToken &&
    (secondToLastToken.indexOf('.') > -1) &&
    (isNaN(Number(secondToLastToken)))) {
    state.splitExpression[state.splitExpression.length - 2] = secondToLastToken.charAt(0)
    state.splitExpression[state.splitExpression.length - 1] = '0.' + lastToken
  }

  if (state.splitExpression[0] === '-') {
    state.splitExpression.unshift('0')
  }

  state.expression = state.splitExpression.join('')

  // only calculate expression if there is at least two operands and an operator
  if (state.splitExpression && state.splitExpression.length > 2) {
    var exp = parser(state.splitExpression)
    var result = calc(exp)
    if (!isNaN(result)) ui.result.textContent = result
  }
}

function backspace () {
  state.expression = state.expression.slice(0, -1)
  update()
}

function clear () {
  state.expression = ''
  state.result = ''
  state.splitExpression = []
  ui.expression.textContent = ''
  ui.result.textContent = ''
}

// function to parse infix equation to postfix using the shunting-yard algorithm
// inspired from: https://en.m.wikipedia.org/wiki/Shunting_yard_algorithm
function parser (tokens) {
  var output = []
  var stack = []

  // list of possible operators in our calculator
  var operators = ['+', '-', '*', '/', '^']

  // key-value store mapping our operators to their respective precedance
  var precedance = {
    '(': 0,
    '+': 1,
    '-': 1,
    '*': 2,
    '/': 2,
    '^': 3,
    ')': 100 // closing parentheses always has "highest precedance"
  }

  tokens.forEach(function (token) {
    // all numbers go to the output
    if (!isNaN(Number(token))) {
      output.push(token)
    }

    if (operators.indexOf(token) > -1) {
      // open parentheses get added to the stack right away
      if (token === '(') {
        stack.push(token)
      }

      // a closing parentheses indicates that its time
      // to pop operators off the stack onto the output queue
      // until the opening parentheses is reached
      if (token === ')') {
        for (var i = stack.length - 1; i > 0; i--) {
          var operator = stack[i]
          if (operator !== '(') output.push(stack.pop())
          if (operator === '(') {
            stack.pop()
            break
          }
        }
      }

      // while the stack contains operators,
      // check if the precendance of the token is less than
      // that of the operator.  if so, append the top of the stack to
      // the output.
      while (stack.length) {
        var stackOperator = stack[stack.length - 1]

        // if the token is right associative check if precedance
        // is less than stack
        if (token === '^' && (precedance[token] < precedance[stackOperator])) {
          output.push(stack.pop())

        // if the token is left associative check if precedance
        // is less than or equal to stack
        } else if (precedance[token] <= precedance[stackOperator]) {
          output.push(stack.pop())
        } else break
      }
      // no more checks or iterations: push remaining token to the stack
      stack.push(token)
    }
  })

  while (stack.length) output.push(stack.pop())
  return output
}

// calculator for postfix expressions
function calc (arr) {
  // declare a stack:
  // the stack will be used to store numbers from the array
  // and will also be used to remember the result
  // from the operation applied to the two numbers at the top of the stack
  var stack = []

  // decalring the possible operations that our calculator can handle
  var operators = {
    '+': function add (a, b) {
      return a + b
    },
    '-': function subtract (a, b) {
      return a - b
    },
    '*': function multiply (a, b) {
      return a * b
    },
    '/': function divide (a, b) {
      return a / b
    },
    '^': function exponent (a, b) {
      return Math.pow(a, b)
    }
  }

  // loop through the array of tokens:
  // all numbers are immediately added to the stack -
  // if the token is an operator then pop two numbers off the stack and
  // perform the operation that token represents with those numbers then
  // store the result at the top of the stack
  arr.forEach(function (token) {
    if (!isNaN(Number(token))) stack.push(token)
    if (operators.hasOwnProperty(token)) {
      var operation = operators[token]
      var b = Number(stack.pop())
      var a = Number(stack.pop())
      var res = operation(a, b)
      stack.push(res)
    }
  })

  if (stack.length !== 1) return console.error('stack should have only one item')
  return stack[0]
}
