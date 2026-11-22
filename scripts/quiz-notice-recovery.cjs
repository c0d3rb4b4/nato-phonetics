const assert = require('node:assert/strict');

async function withQuizNoticeRecovery(page, audioRecovery, performAction) {
  const answer = page.locator('[data-testid="quiz-answer"]:not([aria-hidden="true"] *)');
  const dismiss = page.locator('[aria-label="Dismiss"]:not([aria-hidden="true"] *)');
  async function dismissNotice() {
    const feedback = await answer.textContent();
    await dismiss.click();
    await dismiss.waitFor({ state: 'hidden' });
    assert.equal(await answer.textContent(), feedback, 'Dismissing a speech notice preserves the submitted answer');
    audioRecovery.push({ viewport: page.viewportSize(), feedback });
  }

  // A real speech error may cover Next or Retry. Use the visible Dismiss action,
  // including when the notice arrives during the attempted click.
  if (await dismiss.isVisible()) await dismissNotice();
  try {
    await performAction();
  } catch (error) {
    if (error.name !== 'TimeoutError' || !await dismiss.isVisible()) throw error;
    await dismissNotice();
    await performAction();
  }
}

module.exports = { withQuizNoticeRecovery };
