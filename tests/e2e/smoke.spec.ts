import { test, expect } from '@playwright/test';

test.describe('クイズアプリ スモークテスト', () => {
  test.beforeEach(async ({ page }) => {
    // アニメーション無効化で安定化
    await page.addStyleTag({ 
      content: '*{transition:none!important;animation:none!important}' 
    });
  });

  test('メニュー画面からクイズ開始', async ({ page }) => {
    await page.goto('/');
    
    // メニュー画面の表示確認
    await expect(page.getByRole('heading', { name: 'プログラミングクイズ' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'スタート' })).toBeVisible();
    
    // スタートボタンをクリック
    await page.getByRole('button', { name: 'スタート' }).click();
    
    // クイズ画面への移行確認
    await expect(page.locator('#question-text')).toBeVisible();
    await expect(page.locator('.answer-btn').first()).toBeVisible();
  });

  test('正解・不正解の色表示確認', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'スタート' }).click();
    
    // 最初の選択肢をクリック（テスト用に正解を想定）
    const firstAnswer = page.locator('.answer-btn').first();
    await firstAnswer.click();
    
    // クラスが追加されるまで待機（より確実）
    await page.waitForFunction(() => {
      const btn = document.querySelector('.answer-btn');
      return btn && (btn.classList.contains('correct') || btn.classList.contains('incorrect') || btn.classList.contains('disabled'));
    }, { timeout: 2000 });
    
    // 正解または不正解のクラスが付いているかチェック（より確実）
    const hasCorrectClass = await firstAnswer.evaluate(el => 
      el.classList.contains('correct')
    );
    const hasIncorrectClass = await firstAnswer.evaluate(el => 
      el.classList.contains('incorrect')
    );
    
    // より詳細なデバッグ情報取得
    const buttonInfo = await firstAnswer.evaluate(el => ({
      classList: Array.from(el.classList),
      backgroundColor: getComputedStyle(el).backgroundColor,
      color: getComputedStyle(el).color
    }));
    
    console.log('Button debug info:', buttonInfo);
    
    expect(hasCorrectClass || hasIncorrectClass).toBe(true);
  });

  test('履歴画面が表示される', async ({ page }) => {
    await page.goto('/');
    
    // 履歴ボタンをクリック
    await page.getByRole('button', { name: '履歴' }).click();
    
    // 履歴画面の表示確認
    await expect(page.getByRole('heading', { name: '解答履歴' })).toBeVisible();
    await expect(page.getByRole('button', { name: '戻る' })).toBeVisible();
  });

  test('統計画面が表示される', async ({ page }) => {
    await page.goto('/');
    
    // 統計ボタンをクリック
    await page.getByRole('button', { name: '統計' }).click();
    
    // 統計画面の表示確認
    await expect(page.getByRole('heading', { name: '統計情報' })).toBeVisible();
    await expect(page.getByRole('button', { name: '戻る' })).toBeVisible();
  });

  test('レスポンシブ対応 - モバイル表示', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    
    // モバイルでの表示確認
    await expect(page.getByRole('heading', { name: 'プログラミングクイズ' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'スタート' })).toBeVisible();
    
    // バージョン表示も確認
    await expect(page.locator('.version-indicator')).toHaveText('v0.19');
  });

  test('設定画面で問題数変更', async ({ page }) => {
    await page.goto('/');
    
    // 設定ボタンをクリック
    await page.getByRole('button', { name: '設定' }).click();
    
    // 設定画面の表示確認
    await expect(page.getByRole('heading', { name: '設定' })).toBeVisible();
    
    // 問題数選択
    await page.getByRole('combobox').selectOption('3');
    
    // 保存ボタンをクリック
    await page.getByRole('button', { name: '保存' }).click();
    
    // メニュー画面に戻る
    await expect(page.getByRole('heading', { name: 'プログラミングクイズ' })).toBeVisible();
  });
});