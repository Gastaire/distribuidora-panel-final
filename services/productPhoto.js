const loadPhotoFromUrl = (url, cors) => new Promise((resolve, reject) => {
    const image = new Image();
    const finish = callback => {
        clearTimeout(timer);
        image.onload = image.onerror = null;
        callback();
    };
    const timer = setTimeout(() => finish(() => reject(new Error('La imagen tardó demasiado.'))), 6000);
    if (cors) image.crossOrigin = 'anonymous';
    image.referrerPolicy = 'no-referrer';
    image.onload = () => finish(() => resolve(image));
    image.onerror = () => finish(() => reject(new Error('No se pudo abrir la imagen.')));
    image.src = url;
});

const optimizeProductPhotoUrl = async input => {
    const url = new URL(input.trim());
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Ingresá un enlace HTTP o HTTPS.');
    try {
        const image = await loadPhotoFromUrl(url.href, true);
        const scale = Math.min(1, 600 / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        return { source: canvas.toDataURL('image/jpeg', 0.8), optimized: true };
    } catch (_) {
        await loadPhotoFromUrl(url.href, false);
        return { source: url.href, optimized: false };
    }
};
