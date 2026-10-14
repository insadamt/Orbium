import { readFile } from 'node:fs/promises';
import { ImageRun } from 'docx';
import sharp from 'sharp';
import { mathjax } from 'mathjax-full/js/mathjax.js';
import { TeX } from 'mathjax-full/js/input/tex.js';
import { SVG } from 'mathjax-full/js/output/svg.js';
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor.js';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js';
import 'mathjax-full/js/input/tex/ams/AmsConfiguration.js';
import 'mathjax-full/js/input/tex/newcommand/NewcommandConfiguration.js';

const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);
const equations = mathjax.document('', {
    InputJax: new TeX({
        packages: ['base', 'ams', 'newcommand'],
        maxBuffer: 20000,
        maxMacros: 1000,
    }),
    OutputJax: new SVG({ fontCache: 'none' }),
});
const rasterOptions = { limitInputPixels: 16_777_216, failOn: 'error' };

export class DocumentMedia {
    constructor(diagrams) {
        this.diagrams = diagrams;
        this.images = new Map();
        this.math = new Map();
    }

    async image(path, label, maxWidth, maxHeight, requestedWidth) {
        if (!this.images.has(path)) {
            const normalized = await sharp(await readFile(path), rasterOptions)
                .rotate()
                .resize({
                    width: 2400,
                    height: 2400,
                    fit: 'inside',
                    withoutEnlargement: true,
                })
                .png()
                .toBuffer({ resolveWithObject: true });
            this.images.set(path, normalized);
        }
        const { data, info } = this.images.get(path);
        const scale = Math.min(
            1,
            maxWidth / info.width,
            maxHeight / info.height,
            requestedWidth ? requestedWidth / info.width : 1,
        );
        return new ImageRun({
            type: 'png',
            data,
            transformation: {
                width: info.width * scale,
                height: info.height * scale,
            },
            altText: {
                title: label || 'Document image',
                description: label || 'Document image',
                name: 'Image',
            },
        });
    }

    async equation(latex, inline, maxWidth, maxHeight) {
        const key = `${inline}:${maxWidth}:${maxHeight}:${latex}`;
        if (!this.math.has(key)) {
            const output = equations.convert(latex, {
                display: !inline,
                em: 16,
                ex: 8,
                containerWidth: maxWidth,
            });
            const svg = adaptor.outerHTML(adaptor.firstChild(output));
            if (svg.includes('data-mjx-error'))
                throw new Error('Invalid equation');
            const viewBox = /viewBox="([^"]+)"/
                .exec(svg)?.[1]
                .split(/\s+/)
                .map(Number);
            if (!viewBox || viewBox.some((value) => !Number.isFinite(value)))
                throw new Error('Invalid equation dimensions');
            const width = Math.max(1, (viewBox[2] / 1000) * 16);
            const height = Math.max(1, (viewBox[3] / 1000) * 16);
            const scale = Math.min(1, maxWidth / width, maxHeight / height);
            const normalized = svg
                .replace(
                    /width="[^"]+"/,
                    `width="${Math.ceil(width * scale * 3)}"`,
                )
                .replace(
                    /height="[^"]+"/,
                    `height="${Math.ceil(height * scale * 3)}"`,
                )
                .replaceAll('currentColor', '#202124');
            const data = await sharp(Buffer.from(normalized), rasterOptions)
                .png()
                .toBuffer();
            this.math.set(key, {
                data,
                width: width * scale,
                height: height * scale,
            });
        }
        const { data, width, height } = this.math.get(key);
        return new ImageRun({
            type: 'png',
            data,
            transformation: { width, height },
            altText: {
                title: 'Equation',
                description: latex,
                name: 'Equation',
            },
        });
    }
}
