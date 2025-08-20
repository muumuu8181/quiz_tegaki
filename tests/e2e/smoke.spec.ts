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

  test('メイン画面のサイズが正確か確認', async ({ page }) => {
    await page.goto('/');
    
    // メイン画面(.screen)のサイズチェック
    const screenInfo = await page.locator('.screen.active').evaluate(el => ({
      width: el.offsetWidth,
      height: el.offsetHeight,
      maxWidth: getComputedStyle(el).maxWidth,
      maxHeight: getComputedStyle(el).maxHeight
    }));
    
    console.log('Screen size info:', screenInfo);
    
    // CSS設定値と一致するかチェック（max-width: 400px, max-height: 700px）
    expect(screenInfo.width).toBeLessThanOrEqual(400);
    expect(screenInfo.height).toBeLessThanOrEqual(700);
    expect(screenInfo.maxWidth).toBe('400px');
    expect(screenInfo.maxHeight).toBe('700px');
  });

  test('ボタンのサイズとパディングが正確か確認', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'スタート' }).click();
    
    // 回答ボタン(.answer-btn)のサイズチェック
    const buttonInfo = await page.locator('.answer-btn').first().evaluate(el => {
      const styles = getComputedStyle(el);
      return {
        width: el.offsetWidth,
        height: el.offsetHeight,
        padding: styles.padding,
        paddingTop: styles.paddingTop,
        paddingBottom: styles.paddingBottom,
        paddingLeft: styles.paddingLeft,
        paddingRight: styles.paddingRight,
        fontSize: styles.fontSize
      };
    });
    
    console.log('Button size info:', buttonInfo);
    
    // CSS設定値と一致するかチェック（padding: 20px, font-size: 1.1rem）
    expect(buttonInfo.paddingTop).toBe('20px');
    expect(buttonInfo.paddingBottom).toBe('20px');
    expect(buttonInfo.paddingLeft).toBe('20px');
    expect(buttonInfo.paddingRight).toBe('20px');
    
    // 最小サイズチェック（padding込みで十分なサイズがあるか）
    expect(buttonInfo.width).toBeGreaterThan(100);
    expect(buttonInfo.height).toBeGreaterThan(60);
  });

  test('モバイル表示時のサイズ調整が正確か確認', async ({ page }) => {
    // モバイルサイズに設定
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.getByRole('button', { name: 'スタート' }).click();
    
    // モバイル時の回答ボタンサイズチェック
    const mobileButtonInfo = await page.locator('.answer-btn').first().evaluate(el => {
      const styles = getComputedStyle(el);
      return {
        width: el.offsetWidth,
        height: el.offsetHeight,
        paddingTop: styles.paddingTop,
        paddingBottom: styles.paddingBottom,
        paddingLeft: styles.paddingLeft,
        paddingRight: styles.paddingRight,
        fontSize: styles.fontSize
      };
    });
    
    console.log('Mobile button size info:', mobileButtonInfo);
    
    // CSS設定値と一致するかチェック（モバイル: padding: 15px, font-size: 1rem）
    expect(mobileButtonInfo.paddingTop).toBe('15px');
    expect(mobileButtonInfo.paddingBottom).toBe('15px');
    expect(mobileButtonInfo.paddingLeft).toBe('15px');
    expect(mobileButtonInfo.paddingRight).toBe('15px');
    
    // モバイル時は通常より小さくなるべき
    expect(mobileButtonInfo.width).toBeGreaterThan(80);
    expect(mobileButtonInfo.height).toBeGreaterThan(50);
    
    // メイン画面のモバイル対応チェック
    const mobileScreenInfo = await page.locator('.screen.active').evaluate(el => ({
      width: el.offsetWidth,
      height: el.offsetHeight,
      padding: getComputedStyle(el).padding,
      borderRadius: getComputedStyle(el).borderRadius
    }));
    
    console.log('Mobile screen size info:', mobileScreenInfo);
    
    // モバイル時の調整値チェック（padding: 20px, border-radius: 15px）
    expect(mobileScreenInfo.padding).toBe('20px');
    expect(mobileScreenInfo.borderRadius).toBe('15px');
  });

  test('テキスト要素のフォントサイズが正確か確認', async ({ page }) => {
    await page.goto('/');
    
    // タイトルのサイズチェック
    const titleInfo = await page.getByRole('heading', { name: 'プログラミングクイズ' }).evaluate(el => ({
      fontSize: getComputedStyle(el).fontSize,
      marginBottom: getComputedStyle(el).marginBottom,
      width: el.offsetWidth,
      height: el.offsetHeight
    }));
    
    console.log('Title size info:', titleInfo);
    
    // CSS設定値と一致するかチェック（font-size: 2.5rem, margin-bottom: 50px）
    expect(parseFloat(titleInfo.fontSize)).toBeGreaterThan(35); // 2.5rem ≈ 40px
    expect(titleInfo.marginBottom).toBe('50px');
    
    // クイズ画面に移動
    await page.getByRole('button', { name: 'スタート' }).click();
    
    // 問題文のサイズチェック
    const questionInfo = await page.locator('#question-text').evaluate(el => ({
      fontSize: getComputedStyle(el).fontSize,
      lineHeight: getComputedStyle(el).lineHeight,
      textAlign: getComputedStyle(el).textAlign,
      width: el.offsetWidth,
      height: el.offsetHeight
    }));
    
    console.log('Question text size info:', questionInfo);
    
    // CSS設定値と一致するかチェック（font-size: 1.3rem, line-height: 1.6, text-align: center）
    expect(parseFloat(questionInfo.fontSize)).toBeGreaterThan(18); // 1.3rem ≈ 20px
    expect(questionInfo.lineHeight).toBe('1.6');
    expect(questionInfo.textAlign).toBe('center');
  });
});