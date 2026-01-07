export const transformToWebp = async (file) => {
    const MAX_WIDTH = 1024; // 최대 너비 설정
    const MAX_HEIGHT = 1024; // 최대 높이 설정

    const webpDataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.src = reader.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                if (!ctx) {
                    reject(new Error('Canvas Context를 가져올 수 없습니다.'));
                    return;
                }

                let width = img.width;
                let height = img.height;

                // 이미지 크기 조정
                if (width > MAX_WIDTH || height > MAX_HEIGHT) {
                    const aspectRatio = width / height;
                    if (width > height) {
                        width = MAX_WIDTH;
                        height = MAX_WIDTH / aspectRatio;
                    } else {
                        height = MAX_HEIGHT;
                        width = MAX_HEIGHT * aspectRatio;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob(
                    (blob) => {
                        if (blob) resolve(blob);
                        else
                            reject(
                                new Error('Failed to convert image to WebP.'),
                            );
                    },
                    'image/webp',
                    0.8, // 품질을 낮춰 파일 크기 줄이기
                );
            };
            img.onerror = (error) => {
                reject(error);
            };
        };

        reader.onerror = (error) => {
            reject(error);
        };

        reader.readAsDataURL(file);
    });

    return new File([webpDataUrl], file.name.replace(/\.[^/.]+$/, '.webp'), {
        type: 'image/webp',
    });
};
