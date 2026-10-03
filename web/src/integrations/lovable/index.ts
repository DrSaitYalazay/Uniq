// cy — Lovable Cloud OAuth STUB.
// Orijinal proje Lovable Cloud üzerinden sosyal giriş (Google/Apple/Microsoft)
// sunuyordu. Kendi sunucuda (cy) bu sağlayıcı yok; e-posta+şifre girişi kullanılır.
// Bu dosya hiçbir yerden import edilmiyor; yalnızca geriye dönük uyumluluk için
// güvenli bir yer tutucu olarak bırakıldı (Supabase/Lovable bağımlılığı YOK).

export const lovable = {
  auth: {
    async signInWithOAuth(_provider: string, _opts?: any) {
      return { error: new Error('OAuth (Lovable Cloud) bu dağıtımda yapılandırılmadı — e-posta/şifre kullanın.') };
    },
  },
};
