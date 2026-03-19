export default function AuthPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="glass flex flex-col items-center gap-8 rounded-2xl px-12 py-16">
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-xl font-bold text-camp-text">AI Camp</h1>
          <p className="text-sm text-camp-text-muted">
            Slack 계정으로 로그인하세요
          </p>
        </div>
        <a
          href="/api/auth/slack"
          className="flex h-12 cursor-pointer items-center gap-3 rounded-xl bg-camp-accent px-6 text-sm font-semibold text-black transition-colors hover:bg-camp-accent-hover"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 54 54"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <g fill="none" fillRule="evenodd">
              <path
                d="M19.712.133a5.381 5.381 0 0 0-5.376 5.387 5.381 5.381 0 0 0 5.376 5.386h5.376V5.52A5.381 5.381 0 0 0 19.712.133m0 14.365H5.376A5.381 5.381 0 0 0 0 19.884a5.381 5.381 0 0 0 5.376 5.387h14.336a5.381 5.381 0 0 0 5.376-5.387 5.381 5.381 0 0 0-5.376-5.386"
                fill="#36C5F0"
              />
              <path
                d="M53.76 19.884a5.381 5.381 0 0 0-5.376-5.386 5.381 5.381 0 0 0-5.376 5.386v5.387h5.376a5.381 5.381 0 0 0 5.376-5.387m-14.336 0V5.52A5.381 5.381 0 0 0 34.048.133a5.381 5.381 0 0 0-5.376 5.387v14.364a5.381 5.381 0 0 0 5.376 5.387 5.381 5.381 0 0 0 5.376-5.387"
                fill="#2EB67D"
              />
              <path
                d="M34.048 54a5.381 5.381 0 0 0 5.376-5.387 5.381 5.381 0 0 0-5.376-5.386h-5.376v5.386A5.381 5.381 0 0 0 34.048 54m0-14.365h14.336a5.381 5.381 0 0 0 5.376-5.386 5.381 5.381 0 0 0-5.376-5.387H34.048a5.381 5.381 0 0 0-5.376 5.387 5.381 5.381 0 0 0 5.376 5.386"
                fill="#ECB22E"
              />
              <path
                d="M0 34.249a5.381 5.381 0 0 0 5.376 5.386 5.381 5.381 0 0 0 5.376-5.386v-5.387H5.376A5.381 5.381 0 0 0 0 34.25m14.336-.001v14.364A5.381 5.381 0 0 0 19.712 54a5.381 5.381 0 0 0 5.376-5.387V34.249a5.381 5.381 0 0 0-5.376-5.387 5.381 5.381 0 0 0-5.376 5.387"
                fill="#E01E5A"
              />
            </g>
          </svg>
          AB180 Slack으로 로그인
        </a>
      </div>
    </div>
  );
}
