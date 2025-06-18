export function compressImage(file: File, maxSizeBytes: number = 1024 * 1024): Promise<File> {
	return new Promise((resolve, reject) => {
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');
		const img = new Image();

		img.onload = () => {
			// Calculate new dimensions to maintain aspect ratio
			let { width, height } = img;
			const maxDimension = 1920; // Max width or height

			if (width > maxDimension || height > maxDimension) {
				if (width > height) {
					height = (height * maxDimension) / width;
					width = maxDimension;
				} else {
					width = (width * maxDimension) / height;
					height = maxDimension;
				}
			}

			canvas.width = width;
			canvas.height = height;

			if (!ctx) {
				reject(new Error('Could not get canvas context'));
				return;
			}

			// Draw and compress
			ctx.drawImage(img, 0, 0, width, height);

			// Start with high quality and reduce until under size limit
			let quality = 0.9;
			let compressed: File | null = null;

			const tryCompress = () => {
				canvas.toBlob(
					(blob) => {
						if (!blob) {
							reject(new Error('Failed to compress image'));
							return;
						}

						compressed = new File([blob], file.name, {
							type: 'image/jpeg',
							lastModified: Date.now(),
						});

						// If under size limit or quality is too low, return result
						if (compressed.size <= maxSizeBytes || quality <= 0.1) {
							resolve(compressed);
						} else {
							// Reduce quality and try again
							quality -= 0.1;
							tryCompress();
						}
					},
					'image/jpeg',
					quality
				);
			};

			tryCompress();
		};

		img.onerror = () => {
			reject(new Error('Failed to load image'));
		};

		img.src = URL.createObjectURL(file);
	});
}
