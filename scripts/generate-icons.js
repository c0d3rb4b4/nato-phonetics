const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '../assets/images/test.svg');
const outputDir = path.join(__dirname, '../assets/images');

// Icon sizes needed for Expo app
const icons = [
  { name: 'icon.png', size: 1024 },
  { name: 'favicon.png', size: 48 },
  { name: 'splash-icon.png', size: 200 },
  { name: 'android-icon-foreground.png', size: 512 },
];

console.log('🎨 Generating app icons from test.svg...\n');

async function generateIcons() {
  const svgBuffer = fs.readFileSync(svgPath);

  for (const { name, size } of icons) {
    const outputPath = path.join(outputDir, name);
    
    try {
      await sharp(svgBuffer)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✓ Generated ${name} (${size}x${size})`);
    } catch (error) {
      console.error(`✗ Failed to generate ${name}:`, error.message);
    }
  }

  // Generate solid background for android-icon-background
  try {
    const bgPath = path.join(outputDir, 'android-icon-background.png');
    await sharp({
      create: {
        width: 512,
        height: 512,
        channels: 4,
        background: { r: 230, g: 244, b: 254, alpha: 1 } // #E6F4FE
      }
    })
    .png()
    .toFile(bgPath);
    console.log(`✓ Generated android-icon-background.png (512x512)`);
  } catch (error) {
    console.error('✗ Failed to generate android-icon-background.png:', error.message);
  }

  // Generate monochrome version
  try {
    const monoPath = path.join(outputDir, 'android-icon-monochrome.png');
    await sharp(svgBuffer)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .grayscale()
      .png()
      .toFile(monoPath);
    console.log(`✓ Generated android-icon-monochrome.png (512x512)`);
  } catch (error) {
    console.error('✗ Failed to generate android-icon-monochrome.png:', error.message);
  }

  console.log('\n✅ Icon generation complete!');
  console.log('\nGenerated files:');
  [...icons, 
    { name: 'android-icon-background.png' },
    { name: 'android-icon-monochrome.png' }
  ].forEach(({ name }) => {
    console.log(`  - assets/images/${name}`);
  });
}

generateIcons().catch(console.error);
