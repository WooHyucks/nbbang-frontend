// 개발자 도구 차단 스크립트 (프로덕션 전용)
(function () {
    'use strict';

    // 프로덕션 환경 체크
    const isProduction =
        window.location.hostname === 'nbbang.shop' ||
        window.location.hostname === 'www.nbbang.shop';

    // 개발 환경에서는 실행하지 않음
    if (!isProduction) {
        return;
    }

    // 콘솔 비활성화
    const noop = function () {};
    const methods = [
        'log',
        'debug',
        'info',
        'warn',
        'error',
        'assert',
        'clear',
        'count',
        'dir',
        'dirxml',
        'group',
        'groupCollapsed',
        'groupEnd',
        'profile',
        'profileEnd',
        'table',
        'time',
        'timeEnd',
        'timeStamp',
        'trace',
    ];

    methods.forEach((method) => {
        window.console[method] = noop;
    });

    // 개발자 도구 감지
    let devtools = {
        open: false,
        orientation: null,
    };

    const threshold = 160;

    setInterval(() => {
        if (
            window.outerHeight - window.innerHeight > threshold ||
            window.outerWidth - window.innerWidth > threshold
        ) {
            if (!devtools.open) {
                devtools.open = true;
                // 개발자 도구가 열리면 페이지 리다이렉트 또는 경고
                document.body.innerHTML = '';
                document.body.style.display = 'flex';
                document.body.style.justifyContent = 'center';
                document.body.style.alignItems = 'center';
                document.body.style.height = '100vh';
                document.body.style.backgroundColor = '#000';
                document.body.innerHTML =
                    '<h1 style="color: #fff; font-family: Arial;">접근이 제한되었습니다.</h1>';
                window.location.href = 'about:blank';
            }
        } else {
            devtools.open = false;
        }
    }, 500);

    // 키보드 단축키 차단
    document.addEventListener('keydown', function (e) {
        // F12
        if (e.keyCode === 123) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        // Ctrl+Shift+I (개발자 도구)
        if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        // Ctrl+Shift+J (콘솔)
        if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        // Ctrl+Shift+C (요소 선택)
        if (e.ctrlKey && e.shiftKey && e.keyCode === 67) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        // Ctrl+U (소스 보기)
        if (e.ctrlKey && e.keyCode === 85) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        // Ctrl+S (저장)
        if (e.ctrlKey && e.keyCode === 83) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        // Ctrl+P (인쇄)
        if (e.ctrlKey && e.keyCode === 80) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        // Ctrl+Shift+Delete (개발자 도구)
        if (e.ctrlKey && e.shiftKey && e.keyCode === 46) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        // Mac: Cmd+Option+I
        if (e.metaKey && e.altKey && e.keyCode === 73) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        // Mac: Cmd+Option+J
        if (e.metaKey && e.altKey && e.keyCode === 74) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        // Mac: Cmd+Option+C
        if (e.metaKey && e.altKey && e.keyCode === 67) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    });

    // 우클릭 차단
    document.addEventListener('contextmenu', function (e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    });

    // 텍스트 선택 차단
    document.addEventListener('selectstart', function (e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    });

    // 드래그 차단
    document.addEventListener('dragstart', function (e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    });

    // 복사 차단
    document.addEventListener('copy', function (e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    });

    // 잘라내기 차단
    document.addEventListener('cut', function (e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    });

    // 붙여넣기 차단
    document.addEventListener('paste', function (e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    });

    // 개발자 도구 감지를 위한 디버거
    (function () {
        function detectDevTools() {
            let start = performance.now();
            debugger; // eslint-disable-line no-debugger
            let end = performance.now();
            if (end - start > 100) {
                // 개발자 도구가 열려있음
                document.body.innerHTML = '';
                document.body.style.display = 'flex';
                document.body.style.justifyContent = 'center';
                document.body.style.alignItems = 'center';
                document.body.style.height = '100vh';
                document.body.style.backgroundColor = '#000';
                document.body.innerHTML =
                    '<h1 style="color: #fff; font-family: Arial;">접근이 제한되었습니다.</h1>';
                window.location.href = 'about:blank';
            }
        }

        setInterval(detectDevTools, 1000);
    })();

    // 콘솔 객체 보호
    Object.defineProperty(window, 'console', {
        value: {},
        writable: false,
        configurable: false,
    });

    // 개발자 도구 관련 객체 보호
    Object.defineProperty(window, 'devtools', {
        get: function () {
            return {};
        },
        set: function () {},
    });

    // eval 함수 비활성화
    window.eval = function () {
        throw new Error('eval is disabled');
    };

    // Function 생성자 비활성화
    window.Function = function () {
        throw new Error('Function constructor is disabled');
    };
})();
