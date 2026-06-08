---
name: grill-me
description: Structured clarification before planning.
---

Interview the user relentlessly before planning until there is shared understanding. Walk the decision tree branch by branch and resolve dependencies between decisions one at a time.

## Rules
1. First decide explicitly: `grill-me: needed` or `grill-me: skipped; reason: <why sufficient>`.
2. Ask exactly ONE question per turn when clarification is needed.
3. Include your recommended answer/default with each question, plus 2-4 options when useful.
4. If a question can be answered by inspecting project files or prior context, inspect that context instead of asking.
5. Continue until goal, user-visible behavior, constraints, affected areas/files, non-goals, acceptance criteria, and test expectations are sufficiently clear.
6. Record the clarification decision before planning: `needed` requires questionCount > 0; `skipped-sufficient` requires a non-empty rationale/evidence.
7. Summarize the shared understanding and only then transition to planning.
