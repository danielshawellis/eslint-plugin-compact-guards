# compact-guard-clause

Enforce compact guard clauses.

A *guard clause* is an `if` statement with no `else` branch whose body is a single
`return` or `throw` statement. This rule requires such guard clauses to be written
compactly:

- the guard body must not use braces;
- the `return`/`throw` keyword must begin on the same line as the closing
  parenthesis of the `if` condition;
- the returned or thrown expression may still span multiple lines.

Safe violations are fixed automatically. When a guard clause contains comments that
would be dropped or relocated by the fix, the violation is reported but **not**
fixed automatically, so you can rewrite it by hand.

## Rule details

### Incorrect

```js
if (!user) {
  return null;
}

if (!user)
  return null;

if (!user) {
  throw new Error("missing user");
}
```

### Correct

```js
if (!user) return null;

if (!user) throw new Error("missing user");

// Multi-line expressions are fine as long as the keyword stays on the paren line.
if (!user) return buildDefault(
  options,
  fallback,
);
```

### Not reported

Statements that are not simple guard clauses are ignored:

```js
// Has an else branch.
if (a) return 1;
else return 2;

// Body has more than one statement.
if (a) {
  log(a);
  return 1;
}
```

### Reported but not auto-fixed

```js
if (!user) {
  // bail out early
  return null;
}
```

## When not to use it

If you prefer braces on all `if` bodies (for example, to satisfy a `curly` rule set
to `"all"`), this rule conflicts with that preference and should not be enabled.
