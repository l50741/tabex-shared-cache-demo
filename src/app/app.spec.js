import app from './app';

jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;

describe('app', () => {

  describe('AppCtrl', () => {
    let ctrl1;

    beforeEach(() => {
      angular.mock.module(app);
      
      angular.mock.inject(($controller) => {
        ctrl1 = $controller('AppCtrl', {});
      });
    });

    it('should have no messages', () => {
      expect(ctrl1.messages.length).toBe(0);
    });

    it('should display the message', () => {
      expect(ctrl1.messages.length).toBe(0);
      ctrl1.newMessage = 'Hello World!';
      ctrl1.send();
      expect(ctrl1.messages.length).toBe(1);
      expect(ctrl1.messages[0].indexOf('Hello World!') !== -1).toBe(true)
    });
  });
});