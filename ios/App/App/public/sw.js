/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-7e5eb42b'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "pwa-maskable-512x512.png",
    "revision": "0b56b1e9c537f6d3c214e44e5782856c"
  }, {
    "url": "pwa-512x512.png",
    "revision": "0b56b1e9c537f6d3c214e44e5782856c"
  }, {
    "url": "pwa-192x192.png",
    "revision": "f5820e55c8e242da6076376cc029cf23"
  }, {
    "url": "index.html",
    "revision": "beb2a1630bc586fd3d88fd873bad2a8c"
  }, {
    "url": "icon.svg",
    "revision": "0fc7aa4f3e1b7b3cf10bba1c374916cb"
  }, {
    "url": "favicon.ico",
    "revision": "17452418558a6b42cc9aab145ed8f61d"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "8271ea80ebd5b8423d50d998f09f927b"
  }, {
    "url": "assets/workbox-window.prod.es5-Bd17z0YL.js",
    "revision": null
  }, {
    "url": "assets/web-DFiLSes7.js",
    "revision": null
  }, {
    "url": "assets/web-BNQ-Ocbx.js",
    "revision": null
  }, {
    "url": "assets/web-BGcDuEp5.js",
    "revision": null
  }, {
    "url": "assets/web-B-ZMyHWB.js",
    "revision": null
  }, {
    "url": "assets/index-hpsEno6l.css",
    "revision": null
  }, {
    "url": "assets/index-BDjY82SC.js",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "8271ea80ebd5b8423d50d998f09f927b"
  }, {
    "url": "favicon.ico",
    "revision": "17452418558a6b42cc9aab145ed8f61d"
  }, {
    "url": "icon.svg",
    "revision": "0fc7aa4f3e1b7b3cf10bba1c374916cb"
  }, {
    "url": "pwa-192x192.png",
    "revision": "f5820e55c8e242da6076376cc029cf23"
  }, {
    "url": "pwa-512x512.png",
    "revision": "0b56b1e9c537f6d3c214e44e5782856c"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "0b56b1e9c537f6d3c214e44e5782856c"
  }, {
    "url": "manifest.webmanifest",
    "revision": "a2203e664a91e8f810bfafa90fc61fe1"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));

}));
