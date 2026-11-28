# Bug Report — EShop SUT (FR-02, FR-07, FR-12)

- **Student ID:** `23120228`
- **Repository:** https://github.com/otis275275/eshop-sut/tree/hw-automation
- **GitHub Issues Page:** https://github.com/otis275275/eshop-sut/issues
- **Test Execution Evidence:** [playwright-report/index.html](./playwright-report/index.html) (`Run by: 23120228 | 2026-11-28T11:30:44.564Z`)

---

## Summary of Logged Bugs (12 GitHub Issues)

| Bug ID | Feature | Related Test Case(s) | Severity | Summary | GitHub Issue | Screenshot |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **BUG-01** | FR-02 | `TC-FR02-06` | High | Account locks after 2 failed attempts instead of 3 (`login_attempts + 2` in `backend/server.js`) | [#26](https://github.com/otis275275/eshop-sut/issues/26) | [bug-01](./screenshots/bug-01-fr02-lockout-threshold.png) |
| **BUG-02** | FR-02 | `TC-FR02-08` | Medium | Account lockout duration is 180 seconds instead of 30 seconds | [#27](https://github.com/otis275275/eshop-sut/issues/27) | [bug-02](./screenshots/bug-02-fr02-lockout-duration.png) |
| **BUG-03** | FR-02 / FR-22 | `TC-FR02-10` | Medium | Login Email input uses `type="text"` instead of `type="email"` | [#28](https://github.com/otis275275/eshop-sut/issues/28) | [bug-03](./screenshots/bug-03-fr02-email-input-type.png) |
| **BUG-04** | FR-02 / FR-22 | `TC-FR02-11` | High (Security) | Login Password input uses `type="text"` exposing password in plaintext | [#29](https://github.com/otis275275/eshop-sut/issues/29) | [bug-04](./screenshots/bug-04-fr02-password-masking.png) |
| **BUG-05** | FR-02 / FR-21 / FR-22 | `TC-FR02-12`, `TC-FR02-13` | Medium (UI) | Login page shows wrong heading (`Đăng Ký`), English button (`Sign In`), and error below submit | [#30](https://github.com/otis275275/eshop-sut/issues/30) | [bug-05](./screenshots/bug-05-fr02-error-placement-ui.png) |
| **BUG-06** | FR-02 / FR-23 | `TC-FR02-14` | Low (UI) | Navbar logout button is labeled `"Thoát"` instead of `"Đăng xuất"` | [#31](https://github.com/otis275275/eshop-sut/issues/31) | [bug-06](./screenshots/bug-06-fr02-logout-label.png) |
| **BUG-07** | FR-07 / FR-24 | `TC-FR07-02` | Low (UI) | Empty shopping cart page is missing illustration or icon | [#32](https://github.com/otis275275/eshop-sut/issues/32) | [bug-07](./screenshots/bug-07-fr07-empty-illustration.png) |
| **BUG-08** | FR-07 | `TC-FR07-05` | High | Adding the same product multiple times creates duplicate rows instead of merging quantity | [#33](https://github.com/otis275275/eshop-sut/issues/33) | [bug-08](./screenshots/bug-08-fr07-duplicate-merge.png) |
| **BUG-09** | FR-07 / FR-23 | `TC-FR07-06`, `07`, `09`, `10`, `11`, `12` | Medium | Cart UI mismatches: missing `+`/`-` buttons, wrong labels (`Giá`, `Tổng tạm tính`, `← Mua tiếp`), missing badge & breadcrumb | [#34](https://github.com/otis275275/eshop-sut/issues/34) | [bug-09](./screenshots/bug-09-fr07-table-ui-controls.png) |
| **BUG-10** | FR-07 / FR-24 | `TC-FR07-08` | Medium | Deleting an item from shopping cart has no confirmation dialog | [#35](https://github.com/otis275275/eshop-sut/issues/35) | [bug-10](./screenshots/bug-10-fr07-delete-confirm.png) |
| **BUG-11** | FR-06 / FR-07 | `TC-FR07-13` | High | Product detail `"Thêm vào giỏ hàng"` button ignores the first click | [#36](https://github.com/otis275275/eshop-sut/issues/36) | [bug-11](./screenshots/bug-11-fr07-product-detail-first-click.png) |
| **BUG-12** | FR-12 / SEC-03 | `TC-FR12-04`, `TC-FR12-07`–`14` | Critical (Security) | Backend Admin & Product APIs missing `role='admin'` check and authentication middleware | [#37](https://github.com/otis275275/eshop-sut/issues/37) | [bug-12](./screenshots/bug-12-fr12-admin-forged-token-rbac.png) |

---

## Notes
- All 26 failed test cases (78 failed runs across Chromium, Microsoft Edge, and WebKit) correspond directly to genuine defects in `eshop-sut` when verified against the specification in `README.md`.
- Every issue above is reproducible 100% deterministically across all 3 browsers.
