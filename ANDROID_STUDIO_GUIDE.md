# BlueCall 안드로이드 스튜디오 APK 제작 및 소스코드 연동 가이드

본 프로젝트를 GitHub를 통해 로컬 컴퓨터로 내려받은 후, **안드로이드 스튜디오(Android Studio)**에서 APK 파일로 빌드하는 2가지 방법을 안내합니다.

---

## 🚀 방법 1: Capacitor를 이용한 정식 하이브리드 앱 빌드 (가장 추천)
웹 소스코드를 안드로이드 앱 내부에 완전히 번들링하여 **인터넷 연결이 불안정한 해상에서도 즉각 구동**되는 정식 네이티브 APK를 생성하는 방식입니다. 이미 프로젝트 루트에 `capacitor.config.json`이 구성되어 있습니다.

### 1단계: GitHub에서 소스코드 다운로드 (로컬 터미널)
```bash
# 1. 깃허브 저장소 클론
git clone <본인_GitHub_레포지토리_URL>
cd <저장소_폴더명>

# 2. 의존성 패키지 설치
npm install

# 3. Capacitor 패키지 설치 (안드로이드 브릿지)
npm install @capacitor/core @capacitor/cli @capacitor/android
```

### 2단계: 웹 소스코드 빌드 및 안드로이드 프로젝트 생성
```bash
# 4. Vite React 프로덕션 빌드 (dist 폴더 생성)
npm run build

# 5. 안드로이드 네이티브 프로젝트 생성 (최초 1회)
npx cap add android

# 6. 빌드된 dist 웹 자산을 안드로이드 프로젝트로 동기화
npx cap sync android
```

### 3단계: 안드로이드 스튜디오에서 열기
```bash
# 7. 안드로이드 스튜디오 바로 실행
npx cap open android
```
*(또는 안드로이드 스튜디오 실행 후 **[Open]**을 눌러 생성된 `android/` 폴더를 직접 선택)*

### 4단계: 앱 아이콘 및 스플래시 화면 등록
1. **앱 아이콘 등록**:
   - 안드로이드 스튜디오 좌측 프로젝트 트리에서 `android/app/src/main/res` 우클릭
   - **New → Image Asset** 클릭
   - **Asset Type**: `Launcher Icons (Adaptive and Legacy)` 선택
   - **Path**: 프로젝트의 `public/app-icon.png` 선택 후 **Finish**
2. **스플래시 화면 등록**:
   - `public/splash-screen.png` 파일을 `android/app/src/main/res/drawable/splash_screen.png`로 복사

### 5단계: APK 파일 빌드 및 추출
1. 상단 메뉴에서 **Build → Build Bundle(s) / APK(s) → Build APK(s)** 클릭
2. 하단에 빌드 완료 알림창이 뜨면 **[locate]** 링크 클릭
3. `app-debug.apk` 파일이 생성되며, 이를 스마트폰에 전송하여 설치하시면 됩니다!

---

## ⚡ 방법 2: 안드로이드 스튜디오에서 초간단 WebView 앱 제작 (5분 컷)
안드로이드 스튜디오에서 빈 프로젝트를 만들고 배포된 BlueCall URL을 웹뷰로 띄우는 가장 빠르고 간편한 방식입니다.

### 1단계: 안드로이드 스튜디오에서 신규 프로젝트 생성
1. 안드로이드 스튜디오 실행 → **New Project**
2. **Empty Views Activity** 선택
   - **Name**: `BlueCall`
   - **Package name**: `com.bluecall.maritime`
   - **Language**: `Kotlin`
   - **Minimum SDK**: `API 26 (Android 8.0)` 이상 권장

### 2단계: 권한 및 설정 (`AndroidManifest.xml`)
`app/src/main/AndroidManifest.xml` 파일에 인터넷 및 위치 권한을 추가합니다:
```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.bluecall.maritime">

    <!-- 인터넷 및 위치 권한 -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="BlueCall"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.MaterialComponents.DayNight.NoActionBar"
        android:usesCleartextTraffic="true">
        ...
    </application>
</manifest>
```

### 3단계: 화면 레이아웃 (`activity_main.xml`)
`app/src/main/res/layout/activity_main.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<androidx.constraintlayout.widget.ConstraintLayout 
    xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="#040d21">

    <WebView
        android:id="@+id/webView"
        android:layout_width="match_parent"
        android:layout_height="match_parent" />

</androidx.constraintlayout.widget.ConstraintLayout>
```

### 4단계: 웹뷰 로딩 코드 (`MainActivity.kt`)
`app/src/main/java/com/bluecall/maritime/MainActivity.kt`:
```kotlin
package com.bluecall.maritime

import android.os.Bundle
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        webView.webViewClient = WebViewClient()
        webView.webChromeClient = WebChromeClient()

        val settings: WebSettings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.allowFileAccess = true
        settings.setSupportZoom(false)

        // ?mode=app 파라미터를 붙여 어민 모바일 앱 화면으로 100% 단독 실행
        val appUrl = "https://ais-pre-seqg3z4v233pepn2oruu2j-25946652106.asia-northeast1.run.app/?mode=app"
        webView.loadUrl(appUrl)
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
```

### 5단계: APK 빌드
- 상단 메뉴 **Build → Build Bundle(s) / APK(s) → Build APK(s)** 클릭
- 생성된 `app-debug.apk`를 안드로이드 스마트폰에 넣고 설치하면 끝!
