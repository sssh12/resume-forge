import { createClient } from "@supabase/supabase-js";

// 브라우저 및 서버 환경 모두에서 접근 가능한 public 환경 변수 로드
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase URL 또는 Anon Key가 누락되었습니다. .env.local 설정을 다시 확인해 주세요.",
  );
}

// 싱글톤 클라이언트 인스턴스 생성 및 export
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // 로컬 스토리지에 자동 로그인 세션 유지
    autoRefreshToken: true, // 토큰 만료 전 자동 갱신
    detectSessionInUrl: true, // OAuth 리다이렉트 시 URL의 해시/쿼리 파라미터에서 세션 자동 추출
  },
  global: {
    fetch: (url, options) => {
      return fetch(url, {
        ...options,
        cache: "no-store", // Next.js의 데이터 캐싱 방지
      });
    },
  },
});
