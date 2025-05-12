---
trigger: manual
description: Comprehensive reference for Taskmaster MCP tools and CLI commands.
globs: **/*
---

# Taskmaster Tool & Command Reference

This document details Taskmaster interactions via MCP tools and `task-master` CLI commands.

**Note:** Use MCP tools for better performance and error handling. CLI commands are user-friendly alternatives. See [`mcp.mdc`](mdc:.cursor/rules/mcp.mdc) and [`commands.mdc`](mdc:.cursor/rules/commands.mdc) for details.

**Important:** AI-powered MCP tools may take up to a minute to complete. Inform users to wait patiently. Key tools include: `parse_prd`, `analyze_project_complexity`, `update_subtask`, `update_task`, `update`, `expand_all`, `expand_task`, and `add_task`.

---

## Initialization & Setup

### 1. Initialize Project (`init`)

- **MCP Tool:** `initialize_project`
- **CLI Command:** `task-master init [options]`
- **Description:** Sets up Taskmaster structure and configuration.
- **Key Options:** `--name`, `--description`, `--version`, `-y`
- **Usage:** Run at project start.

### 2. Parse PRD (`parse_prd`)

- **MCP Tool:** `parse_prd`
- **CLI Command:** `task-master parse-prd [file] [options]`
- **Description:** Parses PRD to generate tasks.
- **Key Options:** `-i`, `-o`, `-n`, `-f`
- **Usage:** Bootstrap projects from requirements.

---

## Task Listing & Viewing

### 3. Get Tasks (`get_tasks`)

- **MCP Tool:** `get_tasks`
- **CLI Command:** `task-master list [options]`
- **Description:** Lists tasks, filterable by status.

### 4. Get Next Task (`next_task`)

- **MCP Tool:** `next_task`
- **CLI Command:** `task-master next [options]`
- **Description:** Shows the next task to work on.

### 5. Get Task Details (`get_task`)

- **MCP Tool:** `get_task`
- **CLI Command:** `task-master show [id] [options]`
- **Description:** Displays detailed task information.

---

## Task Creation & Modification

### 6. Add Task (`add_task`)

- **MCP Tool:** `add_task`
- **CLI Command:** `task-master add-task [options]`
- **Description:** Adds new tasks via description.

### 7. Add Subtask (`add_subtask`)

- **MCP Tool:** `add_subtask`
- **CLI Command:** `task-master add-subtask [options]`
- **Description:** Adds or converts subtasks.

### 8. Update Tasks (`update`)

- **MCP Tool:** `update`
- **CLI Command:** `task-master update [options]`
- **Description:** Updates tasks based on changes.

### 9. Update Task (`update_task`)

- **MCP Tool:** `update_task`
- **CLI Command:** `task-master update-task [options]`
- **Description:** Modifies a specific task.

### 10. Update Subtask (`update_subtask`)

- **MCP Tool:** `update_subtask`
- **CLI Command:** `task-master update-subtask [options]`
- **Description:** Appends notes to subtasks.

### 11. Set Task Status (`set_task_status`)

- **MCP Tool:** `set_task_status`
- **CLI Command:** `task-master set-status [options]`
- **Description:** Updates task status.

### 12. Remove Task (`remove_task`)

- **MCP Tool:** `remove_task`
- **CLI Command:** `task-master remove-task [options]`
- **Description:** Removes tasks permanently.

---

## Task Structure & Breakdown

### 13. Expand Task (`expand_task`)

- **MCP Tool:** `expand_task`
- **CLI Command:** `task-master expand [options]`
- **Description:** Breaks down tasks into subtasks.

### 14. Expand All Tasks (`expand_all`)

- **MCP Tool:** `expand_all`
- **CLI Command:** `task-master expand --all [options]`
- **Description:** Expands all tasks.

### 15. Clear Subtasks (`clear_subtasks`)

- **MCP Tool:** `clear_subtasks`
- **CLI Command:** `task-master clear-subtasks [options]`
- **Description:** Removes subtasks from tasks.

### 16. Remove Subtask (`remove_subtask`)

- **MCP Tool:** `remove_subtask`
- **CLI Command:** `task-master remove-subtask [options]`
- **Description:** Removes or converts subtasks.

---

## Dependency Management

### 17. Add Dependency (`add_dependency`)

- **MCP Tool:** `add_dependency`
- **CLI Command:** `task-master add-dependency [options]`
- **Description:** Defines task dependencies.

### 18. Remove Dependency (`remove_dependency`)

- **MCP Tool:** `remove_dependency`
- **CLI Command:** `task-master remove-dependency [options]`
- **Description:** Removes task dependencies.

### 19. Validate Dependencies (`validate_dependencies`)

- **MCP Tool:** `validate_dependencies`
- **CLI Command:** `task-master validate-dependencies [options]`
- **Description:** Checks for dependency issues.

### 20. Fix Dependencies (`fix_dependencies`)

- **MCP Tool:** `fix_dependencies`
- **CLI Command:** `task-master fix-dependencies [options]`
- **Description:** Fixes dependency issues.

---

## Analysis & Reporting

### 21. Analyze Project Complexity (`analyze_project_complexity`)

- **MCP Tool:** `analyze_project_complexity`
- **CLI Command:** `task-master analyze-complexity [options]`
- **Description:** Analyzes task complexity.

### 22. View Complexity Report (`complexity_report`)

- **MCP Tool:** `complexity_report`
- **CLI Command:** `task-master complexity-report [options]`
- **Description:** Displays complexity report.

---

## File Management

### 23. Generate Task Files (`generate`)

- **MCP Tool:** `generate`
- **CLI Command:** `task-master generate [options]`
- **Description:** Generates Markdown task files.

---

## Environment Variables Configuration

Configure Taskmaster via environment variables like `ANTHROPIC_API_KEY`, `MODEL`, `MAX_TOKENS`, etc., in your `.env` file.

---
