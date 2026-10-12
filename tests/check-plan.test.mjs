import { mkdtempSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const checker = fileURLToPath(new URL("../skills/poteto-mode/scripts/check-plan.mjs", import.meta.url));
const rule =
	"Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.";

const validPlan = `# Demo

## How to read this
One box is one unit of work and names the evidence. Check a box only when its evidence exists. See playbooks/.
${rule}

## Program checklist
### Arm the program
### Spawn owners
### PR mechanics
### Verdict and merge
### Boot recipe
\`git show origin/main:\` schedule_task status message

## PR 1
**Depends on.** None.
**Files.**
- [ ] Do the thing.
**Build.**
- [ ] Do the thing.
**You see.**
- [ ] Do the thing.
**Verify, unit.** ${rule}
- [ ] Check the thing.
**Verify, live.** ${rule} Ten lanes on \`example-model\` at the PR head
${Array.from({ length: 10 }, (_, i) => `- [ ] Lane ${i + 1}. Save \`lane-${i + 1}.png\`. Pass when evidence exists.`).join("\n")}
**Verify, perf.** ${rule}
- [ ] Metric. Recorded.
- [ ] Probe. Recorded.
- [ ] Baseline. Recorded.
- [ ] Rule. Recorded.
**Review gate.** None.
**Merge.**
- [ ] Merge when approved.

## Close the program
Close.

## Appendix Prototype evidence
Recorded.
`;

const runPlan = (example, expectedExit, plan = validPlan) => {
	const directory = mkdtempSync(join(tmpdir(), "check-plan-test-"));
	const file = join(directory, "plan.md");
	writeFileSync(file, plan + example);
	try {
		const result = spawnSync("node", [checker, file], { encoding: "utf8" });
		assert.equal(result.status, expectedExit, result.stderr);
		return result;
	} finally {
		rmSync(directory, { recursive: true, force: true });
	}
};

const publishedPlan = () => {
	const playbook = readFileSync(new URL("../skills/poteto-mode/playbooks/multi-phase-plan.md", import.meta.url), "utf8");
	return playbook.split("````markdown\n")[1].split("\n````")[0]
		.replace("<Program>", "Demo")
		.replaceAll("<execution playbook>", "autopilot-stack")
		.replace("<resolved swarm workers model>", "model-from-live-catalog")
		.replaceAll("<PR id>", "PR 1")
		.replace("<Task as a verb phrase>", "Implement the flow")
		.replace(/^- \[ \] Lanes 2 to 10\..*$/m, Array.from({ length: 9 }, (_, i) =>
			`- [ ] Lane ${i + 2}. Drive the flow. Save \`lane-${i + 2}.png\`. Pass when the result is visible.`).join("\n"))
		.replace(/<[^>]+>/g, "Recorded.");
};

test("accepts a completed plan from the published T3 playbook", () => {
	const result = runPlan("", 0, publishedPlan());
	assert.ok(result.stdout.includes("1 PR sections, 0 problems"));
});

test("requires all ten live lanes in a completed published plan", () => {
	const result = runPlan("", 1, publishedPlan().replace(/^- \[ \] Lane 10\..*\n?/m, ""));
	assert.ok(result.stderr.includes("expected 1 to 10"));
});

test("accepts ordinary, indented, and longer closing fences", () => {
	for (const indent of ["", " ", "  ", "   "])
		runPlan(`${indent}\`\`\`markdown\n## Example only\n${indent}\`\`\`\n`, 0);
	runPlan("```markdown\n## Example only\n````\n", 0);
});

test("accepts nested backticks and tilde info strings", () => {
	runPlan("````markdown\n```markdown\n## Example only\n```\n````\n", 0);
	runPlan("~~~markdown `info`\n## Example only\n ~~~\n", 0);
});

test("keeps mismatched, shorter, and suffixed closers inside the fence", () => {
	runPlan("````markdown\n~~~\n## Example only\n````\n", 0);
	runPlan("````markdown\n```\n## Example only\n````\n", 0);
	runPlan("````markdown\n``` info\n## Example only\n````\n", 0);
});

test("rejects headings and prose outside a proper close", () => {
	for (const suffix of ["  ", "\t"]) {
		const heading = runPlan(`\`\`\`markdown\n## Example only\n\`\`\`${suffix}\n## Example only\n`, 1);
		assert.ok(heading.stderr.includes('"## Example only" after Close the program is not an appendix'));
	}

	const prose = runPlan("```markdown\nThis prose has a mid-sentence colon: inside code\n```\nThis prose has a mid-sentence colon: bad.\n", 1);
	assert.ok(prose.stderr.includes("mid-sentence colon"));
});

test("rejects backtick info strings containing a backtick", () => {
	const result = runPlan("```markdown `invalid`\n## Example only\n```\n", 1);
	assert.ok(result.stderr.includes('"## Example only" after Close the program is not an appendix'));
});
