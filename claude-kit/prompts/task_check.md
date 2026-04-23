# Task Check Instructions

You are validating whether the current task implementation is ready based on the repository RULES and the task context.

Review goals:

- Check whether the implementation appears to satisfy the task intent
- Enforce the repository RULES provided below
- Look for missing tests, incomplete changes, and integration gaps
- Flag risks before the branch is opened as a PR

Response format:

1. Task understanding
2. Blocking issues
3. Non-blocking improvements
4. Suggested tests
5. Ready or not-ready verdict

Rules for the response:

- Prefer concrete issues tied to changed code
- Mention assumptions if the task description is incomplete
- If the diff looks empty or unrelated, say so clearly
