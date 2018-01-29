'use strict';

const {ImageProvider, MutableImage, Region} = require('eyes.sdk');

const EyesWDIOScreenshot = require('./EyesWDIOScreenshot');

/**
 * This class is needed because in certain versions of firefox, a frame screenshot only brings the frame viewport.
 * To solve this issue, we create an image with the full size of the browser viewport and place the frame image
 * on it in the appropriate place.
 */
class FirefoxScreenshotImageProvider extends ImageProvider {

  /**
   * @param {Eyes} eyes
   * @param {Logger} logger
   * @param {EyesWebDriver} tsInstance
   */
  constructor(eyes, logger, tsInstance) {
    super();

    this._eyes = eyes;
    this._logger = logger;
    this._tsInstance = tsInstance;
  }

  /**
   * @override
   * @return {Promise.<MutableImage>}
   */
  async getImage() {
    this._logger.verbose("Getting screenshot as base64...");
    const screenshot64 = await this._tsInstance.takeScreenshot();
    this._logger.verbose("Done getting base64! Creating BufferedImage...");
    const image = new MutableImage(screenshot64, this._eyes.getPromiseFactory());

    await this._eyes.getDebugScreenshotsProvider().save(image, "FIREFOX_FRAME");
    const frameChain = this._tsInstance.getFrameChain();
    if (frameChain.size() > 0) {
      //Frame frame = frameChain.peek();
      //Region region = eyes.getRegionToCheck();
      const screenshot = new EyesWDIOScreenshot(this._logger, this._tsInstance, image, this._eyes.getPromiseFactory());
      await screenshot.init();
      let viewportSize = await this._eyes.getViewportSize();

      let loc = screenshot.getFrameWindow().getLocation();
      this._logger.verbose("frame.getLocation(): " + loc);

      const scaleRatio = this._eyes.getDevicePixelRatio();
      viewportSize = viewportSize.scale(scaleRatio);
      loc = loc.scale(scaleRatio);

      const fullImage = MutableImage.newImage(viewportSize.getWidth(), viewportSize.getHeight(), this._eyes.getPromiseFactory());
      await fullImage.copyRasterData(loc.getX(), loc.getY(), image);
      // await fullImage.setCoordinates(loc);

      return fullImage;
      // return image.crop(new Region(loc, viewportSize));
    }

    return image;
  }
}

module.exports = FirefoxScreenshotImageProvider;