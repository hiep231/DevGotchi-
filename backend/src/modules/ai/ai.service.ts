import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GenerateSpeechDto } from './dto/generate-speech.dto';

const CANNED_REACTIONS: Record<string, string[]> = {
  PUFFY: [
    'Phù... fix xong bug là xẹp bụng thở phào liền! Thưởng trẫm con tôm đi 🦐!',
    'Ê code lúc này dễ gặp bug lắm á nha, cẩn thận kẻo trẫm lại phồng to @@',
    'Bơi quanh màn hình nãy giờ mệt ghê, nhưng thấy bạn code chăm là trẫm vui rồi!',
  ],
  BYTEY: [
    'Beat lofi này cuốn thật đấy! Cùng code thêm 1 phiên nữa nhé purrr 🎵',
    'Giao diện mượt mà thế này mới đúng chuẩn nghệ thuật chứ!',
    'Đuôi sạc USB đầy pin rồi, chiến tiếp thôi nào sen ơi ⚡!',
  ],
  GOLEMY: [
    'Vững như bàn thạch! 500 Internal Error cũng không làm ta lung lay 🪨.',
    'Mầm cây trên đầu trẫm đang đung đưa theo từng dòng code chuẩn chỉ!',
    'Kiên định là chìa khóa của mọi Senior Architect. Tiếp tục nào!',
  ],
  OCTY: [
    '8 xúc tu đang gõ liên hồi không kịp thở nè! Đỉnh nóc kịch trần 🐙!',
    'Nạp thêm một ngụm Espresso rồi rebase Git thôi nào!',
    'Nhiều task quá nhưng trẫm cân tất cả, đừng lo!',
  ],
};

@Injectable()
export class AiService {
  constructor(private readonly config: ConfigService) {}

  async generatePetSpeech(dto: GenerateSpeechDto): Promise<{ success: boolean; quote: string }> {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');

    if (apiKey && apiKey.trim().length > 10) {
      try {
        const prompt = `Bạn là ${dto.petName}, một linh thú ảo 3D loài ${dto.petType} sống trên bàn làm việc của một lập trình viên.
        Tâm trạng hiện tại: ${dto.mood}. Chủ nhân vừa làm việc: ${dto.lastTag || 'code'}.
        Hãy đưa ra DUY NHẤT 1 câu phản hồi ngắn gọn, hóm hỉnh, tấu hài hoặc động viên kèm emoji (dưới 20 từ) bằng tiếng Việt.`;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              maxOutputTokens: 60,
              temperature: 0.8,
            },
          }),
        });

        if (res.ok) {
          const json = await res.json();
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (text) {
            return { success: true, quote: text.replace(/^"|"$/g, '') };
          }
        }
      } catch (err) {
        console.warn('Gemini API call failed, using smart fallback:', (err as Error).message);
      }
    }

    // Smart Canned Fallback
    const pool = CANNED_REACTIONS[dto.petType] || CANNED_REACTIONS.PUFFY;
    const randomQuote = pool[Math.floor(Math.random() * pool.length)];

    return { success: true, quote: randomQuote };
  }
}
