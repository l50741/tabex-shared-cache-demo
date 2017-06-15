import angular from 'angular';
import tabex from 'tabex';
import * as _ from 'lodash';

import '../style/app.css';

let app = () => {
  return {
    template: require('./app.html'),
    controller: 'AppCtrl',
    controllerAs: 'app'
  }
};

class AppCtrl {

  constructor($rootScope, $window, $timeout, $http, $q) {
    this.messages = [];
    this.$rootScope = $rootScope;
    this.$timeout = $timeout;
    this.newMessage = '';
    this.channels = [];
    this.$q = $q;
    this.$http = $http;
    this.urlCache = [];
    this.isMaster = false;
    this.wallpaper = null;
    this.node = null;
    this.live = tabex.client();
    this.liveId = this.live.__node_id__;

    this.live.on('ping', (msg) => {
      $timeout(() => {
        this.messages.push('--> ' + msg + ': ping ' + this.getTime());
        this.messages.push('<-- pong ' + this.getTime());
        this.live.emit('pong', this.live.__node_id__);
      }, 0);
    });

    this.live.on('pong', (msg) => {
      $timeout(() => {
        this.messages.push('--> ' + msg + ': pong ' + this.getTime());
      }, 0);
    });


    this.live.on('text', (msg) => {
      $timeout(() => {
        this.messages.push('--> ' + msg + ' ' + this.getTime());
      }, 0);
    });

    this.live.on('!sys.channels.refresh', (channels) => {
      $timeout(() => {
        this.channels = channels;
      }, 0)
    });

    this.live.on('!sys.master', (node) => {
      $timeout(() => {

      }, 0)
    });

    this.live.on('!sys.master', (node) => {
      $timeout(() => {
        this.node = node;
        this.isMaster = node.node_id === node.master_id;
        if (this.isMaster) {
          this.live.on('wallpaper.request', (params) => {
            this.getWallpapers().then((result) => {
              this.messages.push('<-- send wallpaper (slave) ' + result.url + ' ' + this.getTime());
              this.live.emit('wallpaper.response', { id: params.id, result: result });
            });
          });
        } else {
          this.live.off('wallpaper.request');
        }
      }, 0)
    });

    this.live.emit('text', 'node ' + this.live.__node_id__ + ' joined', true);
  }

  newTab() {
    window.open(window.location.href, '_blank');
  }

  ping() {
    this.messages.push('<-- ping ' + this.getTime());
    this.live.emit('ping', this.live.__node_id__);
  }

  send() {
    this.messages.push('<-- ' + (this.newMessage || 'empty') + ' ' + this.getTime());
    this.live.emit('text', this.live.__node_id__ + ': ' + (this.newMessage || 'empty'));
    this.newMessage = '';
  }

  getWallpaper() {
    this.getWallpapers(this.messages).then((results) => {
      this.wallpaper = results;
    })
  }

  getTime() {
    return new Date().toString();
  }

  getWallpapers() {
    if (this.isMaster) {
      if (this.urlCache.length > 0) {
        this.messages.push('<-- get wallpaper (asking cache) ' + this.getTime());
        const deferred = this.$q.defer();
        var number = Math.floor(Math.random() * 100);
        this.messages.push('--> got wallpaper (cache) ' + this.urlCache[number].url + ' ' + this.getTime());
        deferred.resolve(this.urlCache[number]);
        return deferred.promise;
      } else {
        this.messages.push('<-- get wallpaper (asking reddit) ' + this.getTime());
        return this.$http.get('https://www.reddit.com/r/wallpapers.json?sort=top&limit=100').then((results) => {
          var number = Math.floor(Math.random() * 100);
          this.urlCache = [];
          _.forEach(results.data.data.children, (child) => {
            this.urlCache.push({
              author: child.data.author,
              created: child.data.created,
              score: child.data.score,
              url: child.data.url
            });
          });
          this.messages.push('--> got wallpaper (reddit) ' + this.urlCache[number].url + ' ' + this.getTime());
          return this.urlCache[number];
        }, (error) => {
          console.log(error);
        });
      }
    } else {
      this.messages.push('<-- get wallpaper (asking master) ' + this.getTime());
      const deferred = this.$q.defer();
      const id = Math.floor(Math.random() * 10000);
      this.live.emit('wallpaper.request', { id: id });
      this.live.on('wallpaper.response', (response) => {
        if (response.id === id) {
          this.messages.push('--> got wallpaper (master) ' + response.result.url + ' ' + this.getTime());
          deferred.resolve(response.result);
          this.live.off('wallpaper.response');
        }
      });
      return deferred.promise;
    }
  }
}

const MODULE_NAME = 'app';

angular.module(MODULE_NAME, [])
  .directive('app', app)
  .controller('AppCtrl', AppCtrl);

export default MODULE_NAME;