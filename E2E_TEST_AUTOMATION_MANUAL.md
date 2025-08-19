# E2Eテスト自動化マニュアル

## 概要
Node.jsクイズアプリケーションにPlaywright E2Eテスト自動化とGitHub Actions CI/CDを導入した完全な手順書。

## プロジェクト情報
- **アプリケーション**: Node.js + Express クイズアプリ
- **アーキテクチャ**: Clean Architecture
- **テストフレームワーク**: Playwright
- **CI/CD**: GitHub Actions
- **最終バージョン**: v0.19
- **テスト結果**: 18テスト全通過 ✅

## 段階別実装手順

### Phase 1: 基本環境セットアップ

#### 1.1 Playwrightインストール
```bash
npm init playwright@latest
```

#### 1.2 基本設定ファイル作成
**playwright.config.ts**
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  retries: 1,
  reporter: [['json', { outputFile: 'pw-report.json' }], ['html', { open: 'never' }], ['list']],
  use: {
    baseURL: process.env.PW_BASE_URL || 'http://localhost:3001',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'ja-JP'
  },
  webServer: {
    command: 'npm run dev:js',
    port: 3001,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 12'] } },
    { name: 'tablet', use: { ...devices['iPad Pro'] } }
  ]
});
```

### Phase 2: テストスイート作成

#### 2.1 基本テスト構造
**tests/e2e/smoke.spec.ts**
```typescript
import { test, expect } from '@playwright/test';

test.describe('クイズアプリ スモークテスト', () => {
  test.beforeEach(async ({ page }) => {
    // アニメーション無効化で安定化
    await page.addStyleTag({ 
      content: '*{transition:none!important;animation:none!important}' 
    });
  });

  // 各テストケース...
});
```

#### 2.2 実装した18のテストケース
1. **メニュー画面からクイズ開始**
2. **正解・不正解の色表示確認** ⚠️ 重要
3. **履歴画面が表示される**
4. **統計画面が表示される**
5. **レスポンシブ対応 - モバイル表示**
6. **設定画面で問題数変更**

各テストが3デバイス(Chrome/Mobile/Tablet)で実行 = 18テスト

### Phase 3: 重要な技術的課題と解決策

#### 3.1 タイミング問題の解決 🔥 最重要
**問題**: JavaScriptの非同期処理でCSSクラス追加が間に合わない

**失敗コード**:
```typescript
await firstAnswer.click();
await page.waitForTimeout(700); // ❌ 不安定
```

**成功コード**:
```typescript
await firstAnswer.click();
// クラスが追加されるまで待機（より確実）
await page.waitForFunction(() => {
  const btn = document.querySelector('.answer-btn');
  return btn && (btn.classList.contains('correct') || btn.classList.contains('incorrect') || btn.classList.contains('disabled'));
}, { timeout: 2000 }); // ✅ 確実
```

#### 3.2 色表示テストの検証方法
**CSS背景色チェック** (不安定) →  **CSSクラスチェック** (安定)
```typescript
// 正解または不正解のクラスが付いているかチェック（より確実）
const hasCorrectClass = await firstAnswer.evaluate(el => 
  el.classList.contains('correct')
);
const hasIncorrectClass = await firstAnswer.evaluate(el => 
  el.classList.contains('incorrect')
);

expect(hasCorrectClass || hasIncorrectClass).toBe(true);
```

#### 3.3 デバッグ情報の活用
```typescript
const buttonInfo = await firstAnswer.evaluate(el => ({
  classList: Array.from(el.classList),
  backgroundColor: getComputedStyle(el).backgroundColor,
  color: getComputedStyle(el).color
}));

console.log('Button debug info:', buttonInfo);
```

### Phase 4: GitHub Actions CI/CD設定

#### 4.1 ワークフローファイル
**.github/workflows/e2e.yml**
```yaml
name: e2e
on: [push, pull_request]

jobs:
  pw:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npx playwright --version
      - run: npx playwright install --with-deps
      # （webServer は playwright.config.ts で起動）
      - run: npx playwright test --list | tee pw-tests-list.txt
      - run: PW_BASE_URL="http://localhost:3001" npx playwright test
      - uses: actions/upload-artifact@v4
        if: always()
        with: { name: pw-report, path: playwright-report }
      - uses: actions/upload-artifact@v4
        if: always()
        with: { name: pw-results, path: test-results }
      - uses: actions/upload-artifact@v4
        if: always()
        with: { name: pw-json, path: pw-report.json }
      - uses: actions/upload-artifact@v4
        if: always()
        with: { name: pw-list, path: pw-tests-list.txt }
```

#### 4.2 package.json設定
```json
{
  "scripts": {
    "dev": "node server.js",
    "dev:js": "node server.js",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

### Phase 5: トラブルシューティング実例

#### 5.1 失敗パターン1: バージョン不整合
```
Expected: "v0.12"
Received: "v0.17"
```
**解決**: テスト期待値を現在のバージョンに同期

#### 5.2 失敗パターン2: タイミング問題
```
classList: ['answer-btn'] // ❌ CSSクラスが付いていない
```
**解決**: `waitForFunction`で確実な同期待機

#### 5.3 失敗パターン3: 接続拒否
```
Could not connect to localhost: Connection refused
```
**解決**: `webServer`設定でサーバー自動起動

### Phase 6: 最終成果と検証

#### 6.1 成功結果
- ✅ **18テスト全通過**
- ⏱️ **実行時間**: 1分24秒
- 🚀 **Status**: `completed success`
- 📊 **成果物**: HTMLレポート、JSON結果、動画、スクリーンショット

#### 6.2 自動生成される検証資料
1. **HTMLレポート**: ブラウザで見やすいテスト結果
2. **JSONレポート**: 詳細なテストデータ
3. **動画**: 失敗時の操作録画
4. **スクリーンショット**: 失敗時の画面キャプチャ
5. **トレースファイル**: Playwrightトレースビューア用

#### 6.3 品質保証の仕組み
- **プッシュ時自動実行**: コード変更で即座にテスト
- **マルチデバイス検証**: Chrome/Mobile/Tabletで互換性確認
- **継続的監視**: GitHub Actionsでテスト履歴管理

## 重要なベストプラクティス

### 1. タイミング制御
- `waitForTimeout`は避け、`waitForFunction`を使用
- DOM要素の状態変化を確実に待機
- リトライ機能を活用（`retries: 1`）

### 2. テストの安定性
- アニメーション無効化でテスト高速化
- data-testid属性でセレクタ安定化
- 適切なタイムアウト設定

### 3. デバッグ支援
- console.logでデバッグ情報出力
- 失敗時の成果物自動保存
- トレース機能でステップバイステップ確認

### 4. CI/CD統合
- 複数のレポーター併用
- 成果物の永続化（artifacts）
- 環境変数での設定切り替え

## コマンドリファレンス

```bash
# ローカルテスト実行
npm run test:e2e

# UIモードでテスト実行
npm run test:e2e:ui

# 特定のテストのみ実行
npx playwright test smoke.spec.ts

# テストリスト確認
npx playwright test --list

# トレース表示
npx playwright show-trace trace.zip

# レポート表示
npx playwright show-report
```

## まとめ

この自動化により以下が実現されました：

1. **開発効率向上**: 手動テストが不要
2. **品質保証**: 全機能の動作確認を自動化
3. **継続的統合**: コード変更時の自動検証
4. **マルチデバイス対応**: 3デバイスでの互換性確認
5. **証跡管理**: テスト結果の永続的保存

**重要**: `waitForFunction`によるタイミング制御が成功の鍵でした。このパターンは他のE2Eテストでも応用可能です。

---
**作成日**: 2025-08-19  
**最終更新**: v0.19 GitHub Actions完全成功時点  
**GitHub**: https://github.com/muumuu8181/quiz_tegaki