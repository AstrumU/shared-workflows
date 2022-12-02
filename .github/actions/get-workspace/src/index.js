const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
const path = require('path');
const glob = require('glob');

try {
  const packageManager = core.getInput('package-manager');

  const buildMapping = {
    dist: 'dist',
    tsbuildinfo: 'tsconfig.tsbuildinfo'
  };

  const dependencyMapping = {
    node: 'node_modules'
  };

  const pckJsons = glob
    .sync(`packages/**/package.json`)
    .filter(p => !p.includes('node_modules'))
    .map(a => {
      const newItem = a.split('/');
      return newItem.slice(0, 2).join('/');
    });

  const uniq = [...new Set(pckJsons)];

  const buildResult = [];
  const dependencyResult = [];
  let cache;
  Object.keys(buildMapping).forEach(mKey => {
    uniq.forEach(u => {
      buildResult.push(`${u}/*/${buildMapping[mKey]}`);
    });
  });

  Object.keys(dependencyMapping).forEach(mKey => {
    uniq.forEach(u => {
      dependencyResult.push(`${u}/*/${dependencyMapping[mKey]}`);
    });
  });

  function nodeCache(packageManager, dependencyResult) {
    if (packageManager === 'pnpm') {
      cache = `node_modules,${dependencyResult.toString()}`.replace(/,/g, `\n`);
    } else {
      cache = `node_modules, packages/**/node_modules`.replace(/, /g, `\n`);
    }
    return cache;
  }

  function buildCache(packageManager, buildResult) {
    if (packageManager === 'pnpm') {
      cache = buildResult.toString().replace(/,/g, `\n`);
    } else {
      cache = `packages/**/dist, packages/**/tsconfig.tsbuildinfo`.replace(
        /, /g,
        `\n`
      );
    }
    return cache;
  }

  core.setOutput(
    'dependency-cache-path',
    nodeCache(packageManager, dependencyResult)
  );

  core.setOutput('build-cache-path', buildCache(packageManager, buildResult));

  // const payload = JSON.stringify(github.context.payload, undefined, 2);
} catch (error) {
  core.setFailed(error.message);
}
