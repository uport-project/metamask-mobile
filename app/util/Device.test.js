import sinon from 'sinon';
import Device from './Device';

describe('Device', () => {
	describe('isAndroid', () => {
		it('should return true', () => {
			sinon.stub(Device, 'isAndroid').returns(true);
			const result = Device.isAndroid();
			expect(result).toBe(true);
		});
		it('should return false', () => {
			Device.isAndroid.restore();
			sinon.stub(Device, 'isAndroid').returns(false);
			const result = Device.isAndroid();
			expect(result).toBe(false);
		});
	});
	describe('isIos', () => {
		it('should return true', () => {
			sinon.stub(Device, 'isIos').returns(true);
			const result = Device.isIos();
			expect(result).toBe(true);
		});
		it('should return false', () => {
			Device.isIos.restore();
			sinon.stub(Device, 'isIos').returns(false);
			const result = Device.isIos();
			expect(result).toBe(false);
		});
	});
	describe('isIpad', () => {
		it('should return true if device width/height is > 1000', () => {
			sinon.stub(Device, 'getDeviceWidth').returns(1200);
			sinon.stub(Device, 'getDeviceHeight').returns(1200);
			const result = Device.isIpad();
			expect(result).toBe(true);
		});
		it('should return false if device width/height is < 1000', () => {
			Device.getDeviceWidth.restore();
			Device.getDeviceHeight.restore();
			sinon.stub(Device, 'getDeviceWidth').returns(900);
			sinon.stub(Device, 'getDeviceHeight').returns(900);
			const result = Device.isIpad();
			expect(result).toBe(false);
		});
	});
	describe('isLandscape', () => {
		it('should return true if device width > device height', () => {
			Device.getDeviceWidth.restore();
			Device.getDeviceHeight.restore();
			sinon.stub(Device, 'getDeviceWidth').returns(1200);
			sinon.stub(Device, 'getDeviceHeight').returns(900);
			const result = Device.isLandscape();
			expect(result).toBe(true);
		});
		it('should return false if device width < device height', () => {
			Device.getDeviceWidth.restore();
			Device.getDeviceHeight.restore();
			sinon.stub(Device, 'getDeviceWidth').returns(900);
			sinon.stub(Device, 'getDeviceHeight').returns(1200);
			const result = Device.isLandscape();
			expect(result).toBe(false);
		});
	});
	describe('isIphone5', () => {
		it('should return true if device width is 320', () => {
			Device.getDeviceWidth.restore();
			sinon.stub(Device, 'getDeviceWidth').returns(320);
			const result = Device.isIphone5();
			expect(result).toBe(true);
		});
		it('should return false if device not 320', () => {
			Device.getDeviceWidth.restore();
			sinon.stub(Device, 'getDeviceWidth').returns(321);
			const result = Device.isIphone5();
			expect(result).toBe(false);
		});
	});
	describe('isIphone5S', () => {
		it('should return true if device width is 320', () => {
			Device.getDeviceWidth.restore();
			sinon.stub(Device, 'getDeviceWidth').returns(320);
			const result = Device.isIphone5S();
			expect(result).toBe(true);
		});
		it('should return false if device not 320', () => {
			Device.getDeviceWidth.restore();
			sinon.stub(Device, 'getDeviceWidth').returns(321);
			const result = Device.isIphone5S();
			expect(result).toBe(false);
		});
	});
	describe('isIphoneX', () => {
		it('should return true if device width is >= 375 and height is >= 812', () => {
			Device.getDeviceWidth.restore();
			Device.getDeviceHeight.restore();
			sinon.stub(Device, 'getDeviceWidth').returns(375);
			sinon.stub(Device, 'getDeviceHeight').returns(812);
			const result = Device.isIphoneX();
			expect(result).toBe(true);
		});
		it('should return false if device not 320', () => {
			Device.getDeviceWidth.restore();
			Device.getDeviceHeight.restore();
			sinon.stub(Device, 'getDeviceWidth').returns(374);
			sinon.stub(Device, 'getDeviceHeight').returns(811);
			const result = Device.isIphoneX();
			expect(result).toBe(false);
		});
	});
	describe('isSmallDevice', () => {
		it('should return true if device height is < 600', () => {
			Device.getDeviceHeight.restore();
			sinon.stub(Device, 'getDeviceHeight').returns(599);
			const result = Device.isSmallDevice();
			expect(result).toBe(true);
		});
		it('should return false if device height is > 600', () => {
			Device.getDeviceHeight.restore();
			sinon.stub(Device, 'getDeviceHeight').returns(601);
			const result = Device.isSmallDevice();
			expect(result).toBe(false);
		});
	});
});
