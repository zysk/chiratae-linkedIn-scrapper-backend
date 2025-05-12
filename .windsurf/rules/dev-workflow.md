---
trigger: manual
---

# Task Master Development Workflow

This guide outlines using Task Master for managing software development projects.

## Interaction Methods

1. **MCP Server (Preferred for Integrated Tools)**:

    - Recommended for AI agents and integrated environments.
    - Offers structured data exchange and error handling.
    - Restart if core logic or tool definitions change.

2. **`task-master` CLI (For Users & Fallback)**:
    - User-friendly terminal interface.
    - Install globally or use locally via `npx`.
    - Mirrors MCP tools for functionality.

## Development Workflow

- Start projects with `init` or `parse_prd`.
- Use `get_tasks` to view tasks.
- Determine next task with `next_task`.
- Analyze complexity with `analyze_complexity`.
- Select tasks based on dependencies and priority.
- View task details with `get_task`.
- Break down tasks with `expand_task`.
- Implement code following task details.
- Verify tasks before marking as complete.
- Update tasks with `update` or `update_task`.
- Add tasks or subtasks as needed.
- Maintain dependencies with `add_dependency` and `validate_dependencies`.
- Report progress with `get_tasks`.

## Task Complexity Analysis

- Use `analyze_complexity` for analysis.
- Review reports for high complexity tasks.
- Use results for subtask allocation.

## Task Breakdown

- Use `expand_task` for complex tasks.
- Add `--research` for research-backed expansion.
- Review and adjust subtasks as needed.

## Handling Implementation Drift

- Use `update` or `update_task` for significant changes.
- Update future tasks as needed.

## Task Status Management

- Use 'pending', 'done', 'deferred', or custom statuses.

## Task Structure Fields

- **id**: Unique identifier.
- **title**: Brief description.
- **description**: Task summary.
- **status**: Current state.
- **dependencies**: Prerequisite tasks.
- **priority**: Importance level.
- **details**: Implementation instructions.
- **testStrategy**: Verification approach.
- **subtasks**: Specific tasks list.

## Environment Variables

- Configure behavior with environment variables like `ANTHROPIC_API_KEY`, `MODEL`, `MAX_TOKENS`, etc.

## Next Task Determination

- Use `next_task` to identify tasks.
- Prioritize by level, dependency, and ID.

## Viewing Task Details

- Use `get_task` for specific task details.
- Dot notation for subtasks.

## Managing Dependencies

- Use `add_dependency` and `remove_dependency`.
- Prevent circular dependencies.

## Iterative Subtask Implementation

1. **Understand Goal**: Use `get_task` for requirements.
2. **Plan**: Identify code changes.
3. **Log**: Use `update_subtask` for detailed plans.
4. **Verify**: Confirm plan in subtask details.
5. **Implement**: Set status to in-progress.
6. **Refine**: Log progress and challenges.
7. **Review**: Update rules post-implementation.
8. **Complete**: Mark subtask as done.
9. **Commit**: Stage changes and commit.
10. **Next Subtask**: Repeat process.

## Code Analysis & Refactoring

- Use grep/ripgrep for function searches.
