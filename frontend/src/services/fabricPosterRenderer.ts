import { fabric } from 'fabric';
import WebFont from 'webfontloader';

export interface PosterDesign {
  layout: string;
  colors: {
    background: string;
    backgroundGradient?: string[];
    primary: string;
    accent: string;
    textColor: string;
  };
  headline: {
    text: string;
    tamilText?: string;
    fontSize: number;
    fontFamily: string;
  };
  subheading: {
    text: string;
    fontSize: number;
  };
  discount: {
    text: string;
    position: string;
    badgeColor: string;
  };
  callToAction: string;
  decorativeElements?: Array<{
    type: string;
    color: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    opacity?: number;
  }>;
  culturalSymbols?: Array<{
    emoji: string;
    position: { x: number; y: number };
    size?: number;
  }>;
  fontPairs: {
    heading: string;
    body: string;
  };
}

export interface RenderOptions {
  width?: number;
  height?: number;
  productImage?: string;
  format?: 'png' | 'jpeg';
  quality?: number;
}

const getGradient = (design: PosterDesign, height: number) => {
  const gradientStops = design.colors.backgroundGradient;
  if (!gradientStops || gradientStops.length < 2) {
    return design.colors.background;
  }

  return new fabric.Gradient({
    type: 'linear',
    coords: { x1: 0, y1: 0, x2: 0, y2: height },
    colorStops: [
      { offset: 0, color: gradientStops[0] },
      { offset: 1, color: gradientStops[1] }
    ]
  });
};

const loadImage = (url: string): Promise<fabric.Image> => {
  return new Promise((resolve, reject) => {
    fabric.Image.fromURL(
      url,
      (img: fabric.Image | null) => {
        if (!img) {
          reject(new Error('Failed to load image'));
          return;
        }
        resolve(img);
      },
      { crossOrigin: 'anonymous' }
    );
  });
};

export const renderPosterToImage = async (
  design: PosterDesign,
  options: RenderOptions = {}
): Promise<string> => {
  const {
    width = 1080,
    height = 1080,
    productImage,
    format = 'png',
    quality = 1
  } = options;

  const canvasEl = document.createElement('canvas');
  const canvas = new fabric.Canvas(canvasEl, {
    width,
    height
  });

  try {
    const gradient = getGradient(design, height);
    canvas.setBackgroundColor(gradient as any, canvas.renderAll.bind(canvas));

    design.decorativeElements?.forEach((el) => {
      let shape: fabric.Object | null = null;
      if (el.type === 'circle') {
        shape = new fabric.Circle({
          left: el.position.x,
          top: el.position.y,
          radius: el.size.width / 2,
          fill: el.color,
          opacity: el.opacity ?? 0.3
        });
      } else if (el.type === 'rectangle') {
        shape = new fabric.Rect({
          left: el.position.x,
          top: el.position.y,
          width: el.size.width,
          height: el.size.height,
          fill: el.color,
          opacity: el.opacity ?? 0.3
        });
      }
      if (shape) {
        canvas.add(shape);
      }
    });

    design.culturalSymbols?.forEach((symbol) => {
      const emoji = new fabric.Text(symbol.emoji, {
        left: symbol.position.x,
        top: symbol.position.y,
        fontSize: symbol.size || 60,
        opacity: 0.7
      });
      canvas.add(emoji);
    });

    const headline = new fabric.Text(design.headline.text, {
      left: width / 2,
      top: 160,
      fontSize: design.headline.fontSize,
      fontFamily: design.headline.fontFamily,
      fill: design.colors.textColor,
      fontWeight: 'bold',
      textAlign: 'center',
      originX: 'center',
      shadow: 'rgba(0,0,0,0.4) 4px 4px 10px'
    });
    canvas.add(headline);

    if (design.headline.tamilText) {
      const tamilText = new fabric.Text(design.headline.tamilText, {
        left: width / 2,
        top: 100,
        fontSize: design.headline.fontSize * 0.6,
        fontFamily: 'Noto Sans Tamil',
        fill: design.colors.accent,
        fontWeight: 'bold',
        textAlign: 'center',
        originX: 'center'
      });
      canvas.add(tamilText);
    }

    const subheading = new fabric.Text(design.subheading.text, {
      left: width / 2,
      top: 280,
      fontSize: design.subheading.fontSize,
      fontFamily: design.fontPairs.body,
      fill: design.colors.textColor,
      textAlign: 'center',
      originX: 'center',
      opacity: 0.9
    });
    canvas.add(subheading);

    const badgePositions: Record<string, { x: number; y: number }> = {
      'top-right': { x: width - 150, y: 120 },
      'top-left': { x: 150, y: 120 },
      center: { x: width / 2, y: height / 2 }
    };
    const badgePos = badgePositions[design.discount.position] || badgePositions['top-right'];

    const badge = new fabric.Circle({
      left: badgePos.x,
      top: badgePos.y,
      radius: 90,
      fill: design.discount.badgeColor,
      shadow: 'rgba(0,0,0,0.3) 5px 5px 15px',
      originX: 'center',
      originY: 'center'
    });
    canvas.add(badge);

    const discountText = new fabric.Text(design.discount.text, {
      left: badgePos.x,
      top: badgePos.y,
      fontSize: 42,
      fontFamily: 'Impact',
      fill: '#FFFFFF',
      textAlign: 'center',
      originX: 'center',
      originY: 'center',
      fontWeight: 'bold'
    });
    canvas.add(discountText);

    if (productImage) {
      const img = await loadImage(productImage);
      img.scaleToWidth(400);
      img.set({
        left: width / 2,
        top: height - 360,
        originX: 'center',
        shadow: 'rgba(0,0,0,0.3) 0px 10px 30px'
      });
      canvas.add(img);
    }

    const ctaButton = new fabric.Rect({
      left: width / 2,
      top: height - 120,
      width: 350,
      height: 70,
      fill: design.colors.primary,
      rx: 35,
      ry: 35,
      originX: 'center',
      shadow: 'rgba(0,0,0,0.3) 0px 5px 15px'
    });
    canvas.add(ctaButton);

    const ctaText = new fabric.Text(design.callToAction, {
      left: width / 2,
      top: height - 85,
      fontSize: 32,
      fontFamily: design.fontPairs.body,
      fill: '#FFFFFF',
      fontWeight: 'bold',
      originX: 'center',
      originY: 'center'
    });
    canvas.add(ctaText);

    canvas.renderAll();

    const dataURL = canvas.toDataURL({
      format,
      quality,
      multiplier: 2
    });

    canvas.dispose();
    return dataURL;
  } catch (error) {
    canvas.dispose();
    throw error;
  }
};

export const loadGoogleFonts = (fonts: string[]): Promise<void> => {
  return new Promise((resolve) => {
    if (!fonts.length) {
      resolve();
      return;
    }

    WebFont.load({
      google: { families: fonts },
      active: resolve,
      inactive: resolve
    });
  });
};
