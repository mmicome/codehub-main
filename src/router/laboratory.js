import { app } from "../app.js";
import {
  constructServerLayout,
  sendLayoutHTTPResponse,
} from "single-spa-layout/server";
import _ from "lodash";
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = fileURLToPath(import.meta.url);
import { getImportMaps } from "single-spa-web-server-utils";
import { createBundleRenderer } from 'vue-server-renderer'
import favicon from 'serve-favicon'
import LRU from'lru-cache' // 缓存
const resolve = file => path.resolve(__dirname, file)
// 设置 favicon
app.use(favicon(resolve('../../../favicon.ico')))

const microCache = new LRU({
  max: 100,
  maxAge: 60 * 60 * 24 * 1000 // 重要提示：缓存资源将在 1 天后过期。
})

const serverLayout = constructServerLayout({
  filePath: "src/index.ejs",
});

function createRenderer(bundle, options) {
  bundle.basedir = 'http://localhost:8080/dist/';
  options.clientManifest.publicPath = 'http://localhost:8080/dist/'
  return createBundleRenderer(
      bundle,
      Object.assign(options, {
          basedir: resolve('../dist'),
          runInNewContext: false
      })
  )
}

const [bundle, clientManifest] = await Promise.all([
  import('http://localhost:8080/dist/vue-ssr-server-bundle.json'),
  import('http://localhost:8080/dist/vue-ssr-client-manifest.json')
]);

const renderer = createRenderer(bundle.default, {
  template: '<!--vue-ssr-outlet-->',
  clientManifest: clientManifest.default
})

function render(req, props) {
  return new Promise((resolve) => {
    const hit = microCache.get(req.url)
    if (hit) {
      console.log('Response from cache')
      resolve(hit);
    }
    // const handleError = err => {
    //   if (err.url) {
    //       res.redirect(err.url)
    //   } else if (err.code === 404) {
    //       res.status(404).send('404 | Page Not Found')
    //   } else {
    //       res.status(500).send('500 | Internal Server Error~')
    //       console.log(err)
    //   }
    // }
    const context = {
      title: 'SSR 测试', // default title
      url: req.url
    }
    renderer.renderToString(context, (err, html) => {
      if (err) {
          // return handleError(err)
      }

      microCache.set(req.url, html);
      resolve(html);
    })
  })
}

app.use("/laboratory", (req, res, next) => {
    const developmentMode = process.env.NODE_ENV === "development";
    const importSuffix = developmentMode ? `?ts=${Date.now()}` : "";
  
    const importMapsPromise = getImportMaps({
      url:
        "http://localhost:9041/importmap.json",
      nodeKeyFilter(importMapKey) {
        return importMapKey.startsWith("@codehub");
      },
      req,
      allowOverrides: true,
    }).then(({ nodeImportMap, browserImportMap }) => {
      global.nodeLoader.setImportMapPromise(Promise.resolve(nodeImportMap));
      if (developmentMode) {
        browserImportMap.imports["@codehub/root-config"] =
          "http://localhost:9876/codehub-root-config.js";
        browserImportMap.imports["@codehub/root-config/"] =
          "http://localhost:9876/";
      }
      return { nodeImportMap, browserImportMap };
    });
  
    const props = {
      user: {
        id: 1,
        name: "Test User",
      },
    };
  
    const fragments = {
      importmap: async () => {
        const { browserImportMap } = await importMapsPromise;
        return `<script type="systemjs-importmap">${JSON.stringify(
          browserImportMap,
          null,
          2
        )}</script>`;
      },
    };
  
    const renderFragment = (name) => fragments[name]();
  
    sendLayoutHTTPResponse({
      serverLayout,
      urlPath: req.originalUrl,
      res,
      renderFragment,
      async renderApplication({ appName, propsPromise }) {
        await importMapsPromise;
        const [props] = await Promise.all([
          propsPromise,
        ]);
        return render(req, props);
      },
      async retrieveApplicationHeaders({ appName, propsPromise }) {
        await importMapsPromise;
        const [props] = await Promise.all([
          propsPromise,
        ]);
        return props;
      },
      async retrieveProp(propName) {
        return props[propName];
      },
      assembleFinalHeaders(allHeaders) {
        return Object.assign({}, Object.values(allHeaders));
      },
    })
      .then(next)
      .catch((err) => {
        console.error(err);
        res.status(500).send("A server error occurred");
      });
  });
  