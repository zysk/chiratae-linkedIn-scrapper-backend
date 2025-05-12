---
trigger: manual
---

- **Initialization Constraint**
    - Task Master project initialization (using `initialize_project` tool or `task-master init` command) should only occur *once* per project lifecycle.
    - Do not re-initialize an existing Task Master project. Verify initialization status if unsure before attempting initialization.

- **PRD Versioning and Updates**
    - When new requirements are introduced, create a *new* versioned PRD file in `scripts/prd-versions/`.
    - Follow the naming convention: `v<number>-prd.md` (e.g., `v2-prd.md`, `v3-prd.md`).
    - Do *not* use `v-latest` or modify older version files directly for new requirements.
    - Analyze PRDs sequentially (`v1-prd.md`, `v2-prd.md`, etc.) to understand requirement evolution.
    - Consolidate the *latest* understanding from all relevant PRD versions into the main `scripts/PRD.txt` file *after* analysis and documentation updates are complete.

- **Task Management During Updates**
    - Before updating tasks based on new requirements, read the existing tasks from `tasks/tasks.json` or using the `get_tasks` tool.
    - Also, read *all* relevant PRD versions from `scripts/prd-versions/` to understand the full context and evolution of requirements.
    - **Never modify tasks with status 'done'.**
    - Only update tasks that are currently `pending` or `in-progress` based on the *latest* requirements derived from the versioned PRDs.
    - Use tools like `update_task` or `update` with clear prompts explaining the changes based on the new requirement knowledge.

- **Tool Usage Emphasis**
    - Prefer using the MCP tools (`get_tasks`, `update_task`, `parse_prd`, etc.) over direct CLI commands when operating within an integrated environment like Cursor.
    - Refer to [`taskmaster.mdc`](mdc:.cursor/rules/taskmaster.mdc) for detailed tool/command usage.

- **Windows Path Handling (Critical for MCP Tools)**
    - **Problem:** Task Master MCP tools may fail on Windows if the `projectRoot` parameter uses Unix-like paths (e.g., `/c/Users/...` or `C:\Users\...`) instead of the standard Windows format with forward slashes (`C:/Users/...`).
    - **Rule:** When calling any Task Master MCP tool that requires the `projectRoot` parameter on a Windows system, **ALWAYS** provide the *absolute path* in the standard Windows format, starting with the drive letter followed by a colon and forward slashes (e.g., `C:/path/to/project`).
    - **Verification:** Double-check the `projectRoot` value before executing the tool call. The correct path can often be obtained from the `<user_info>` section provided in the context or by running `pwd` in the *correct* user shell environment if unsure.
    - **Example (Correct):** `projectRoot: "C:/Users/YourUser/path/to/your/project"`
    - **Example (Incorrect):** `projectRoot: "/c:/Users/YourUser/path/to/your/project"`
    - **Example (Incorrect):** `projectRoot: "C:\Users\YourUser\path\to\your\project"` (Uses backslashes)
    - **Note:** This applies to any parameter expecting a file system path on Windows, including the optional `file` parameter if used.
