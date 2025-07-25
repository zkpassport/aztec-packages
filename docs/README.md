# Aztec Network Documentation

Documentation for the Aztec Network, built with docusaurus

You can view the latest successful build here: https://docs.aztec.network

## Docusaurus

This website is built using [Docusaurus 3](https://docusaurus.io/), a modern static website generator.

### Files

Here are the most relevant files you should be aware of:

- `.gitignore` - This specifies which files Git should ignore when committing and pushing to remote repositories.
- `docusaurus.config.js` - This is the configuration file for Docusaurus. You can manage the links in the header and footer, and site metadata here. A more in-depth introduction to this configuration file is available on the [Docusaurus website](https://docusaurus.io/docs/configuration) and full documentation for the API is [here](https://docusaurus.io/docs/docusaurus.config.js).
- `package.json` - This specifies the dependencies for the website and the commands that you can run with yarn.
- `sidebars.js` - This specifies the sidebars for your documentation. The full documentation for this file is available on the [Docusaurus website](https://docusaurus.io/docs/sidebar).
- `yarn.lock` - This specifies the full dependencies for the website including the dependencies of the dependencies listed in `package.json`. Do not edit this file directly. Edit `package.json` instead, then run `yarn` as described above.

The .md files in the `docs/` directory are the docs. See the [Docusaurus website](https://docusaurus.io/docs/docs-introduction) for the full documentation on how to create docs and to manage the metadata.

## Versioning

Aztec Docs are versioned. Every version known is literally a copy of the website, and is in `versioned_docs` (sidebars are in `versioned_sidebars`). Seems silly but it's not, it allows you to hot-fix previous versions.

When you look at the published docs site, you will see three versions in the version dropdown: `Next`, `alpha-testnet`, and the latest sandbox release e.g. `v0.86.0`. Updating the files in the `docs` folder will update the next version (which is not currently published, but will be when the next release is cut), updating the files in `versioned_docs/version-v0.87.8` folder will update the `0.87.8` version. Note that you cannot use the macros (`#include_aztec_version` and `#include_code`) in the `versioned_docs` folder, since those docs have already been processed and built. Instead, just drop the code snippets, version numbers or links directly in the docs as you'd like them to be rendered.

The way docs builds work is the following:

- CI runs on merge to master, builds the dependencies needed to build the docs, then deploys on the main docs website
- [This Github Action](../.github/workflows/docs-preview.yml) runs on pull requests if they have any docs change, and quite similarly builds the dependencies and the docs, then gives you a nice preview so you can check that everything is alright
- [This Github Action](../.github/workflows/release-please.yml) is Release-Please, a framework made to organize different commits into releases. When it merges to master, it runs. When it runs, it builds the dependencies and cuts a new version of the docs, with the same tag that is being released

The `#include_aztec_version` and `#include_code` macros look for the version tag in an environment variable `COMMIT_TAG`, so you can build the docs specifying a version with the following command (e.g. for v0.84.0). Remove the versions listed in `versions.json` before running:

```bash
COMMIT_TAG=v0.84.0 yarn build
```

You can add the aztec version to a docs page without the `v` prefix with `#include_version_without_prefix`, so COMMIT_TAG `v0.85.0` will render as `0.85.0`.

### How do I change the versions that show in the website

When docusaurus builds, it looks for the `versions.json` file, and builds the versions in there, together with the version in `docs`.

## Releases

A new docs site is published on every merge to the master branch.

### Installation

To install the dependencies and dev dependencies, run:

```
$ yarn
```

### Development

Aztec docs pull some code from the rest of the repository. This allows for great flexibility and maintainability. Some documentation is also autogenerated.

For that reason, there's a preprocessing step. You can run that step ad-hoc with `yarn preprocess` or `yarn preprocess:dev` if you want it to stay running and watching for changes.

This step does the following:

- Pulls the code from the source files using the `#include` macros explained below.
- Autogenerates documentation using the scripts in the `src` file.
- Puts the final documentation in a `processed-docs` folder.

> [!NOTE]
> You likely want to benefit from webpack's hot reload, which allows you to immediately see your changes when you develop on the docs. For this reason, the `yarn dev` commands will add the `ENV=dev` environment variable, which makes docusaurus serve the `docs folder` instead of the `processed docs`.
> If you're making changes to included code or aztec.nr reference, you can run `yarn docs` instead.

#### Run locally

To run docusaurus development server and use hot reload (watch for changes), run:

```
$ yarn dev:local
```

#### Run remotely (on mainframe)

It's common for developers to work on codespaces or other remote targets. For this you need to expose your development server. This is common enough to be the default development command:

```
$ yarn dev
```

### Build

To build the final version of the docs (which includes processes not present in dev, like broken links checking and minification), you can run:

```
$ yarn build
```

This command runs the preprocess command, generates static content into the `build` directory and can be served using any static contents hosting service.

## Macros

As mentioned above, Aztec docs pull code from the source files. This makes it easy to include sections of the source code in tutorials and other examples.

This is done via macros which are processed in the `process` step described above.

### `#include_code`

You can embed code snippets into a `.md`/`.mdx` file from code which lives elsewhere in the repo.

- In your markdown file:
  - `#include_code identifier path/from/repo/root/to/file.ts language`
  - E.g. `#include_code hello path/from/repo/root/to/file.ts typescript`
  - See [here](docusaurus.config.js) for supported languages and the exact name to use for that language.
- In the corresponding code delineate the code snippet with comments:
  - ```typescript
    some code
    some code
    // docs:start:hello
    more code
    more code
    // this-will-error <-- you can use docusaurus highlighting comments.
    this code will be highlighted red
    more code
    // highlight-next-line
    this line will be highlighted
    more code
    // highlight-start
    this line will be highlighted
    this line will be highlighted
    // highlight-end
    more code
    // docs:end:hello
    more code
    ```
- You can even include chunks of the same piece of code (with different highlighting preferences) into different parts of the docs:
  - ```typescript
      some code
      some code
      // docs:start:hello:goodbye
      this code will appear in the 'hello' snippet and the 'goodbye' snippet.
      this code will appear in the 'hello' snippet and the 'goodbye' snippet.
      // this-will-error
      this code will be highlighted red in all snippets.
      // highlight-next-line:goodbye
      this line will be highlighted only in the 'goodbye' snippet.
      // highlight-start:goodbye:hello
      this line will be highlighted in both the `hello` and `goodbye` snippets
      this line will be highlighted in both the `hello` and `goodbye` snippets
      // highlight-end:goodbye
      this line will be highlighted only in the 'hello' snippet.
      // highlight-end:hello
      this code will appear in the 'hello' snippet and the 'goodbye' snippet.
      // docs:end:goodbye
      this code will appear only in the 'hello' snippet.
      // docs:end:hello
      some code
      some code
    ```
  - Somewhere in your markdown, you can then write:
    - `#include_code hello path/from/repo/root/to/file.ts typescript`
  - And somewhere else, you can write:
    - `#include_code goodbye path/from/repo/root/to/file.ts typescript`
- You can add as a last optional parameter a comma-separated list of options to tweak the display of the code block, for example:
  - `#include_code hello path/from/repo/root/to/file.ts typescript noTitle,noLineNumbers,noSourceLink`
- Ironically, we can't show you a rendering of these examples, because this README.md file doesn't support the `#include_code` macro!

> See [here](./src/components/GithubCode/index.js) for another way to include code, although this approach is flakier, so the above `#include_code` macro is preferred.

### `#include_aztec_version`

This macros will be replaced inline with the current aztec packages tag, which is `v0.77.0` at the time of these writing. This value is sourced from `.release-please-manifest.json` on the project root.

Alternatively, you can also use the `AztecPackagesVersion()` js function, which you need to import explicitly:

```
import { AztecPackagesVersion } from "@site/src/components/Version";
<>{AztecPackagesVersion()}</>
```

### `#include_testnet_version`

This macros will be replaced inline with the provided testnet version, which is `0.87.5` at the time of these writing. This value is sourced from the `TESTNET_TAG` environment variable when running `yarn build` (e.g. `TESTNET_TAG=0.87.5 yarn build`).
This value may be different from the `#include_aztec_version` macro, since the testnet version is not always the same as the latest aztec packages version.

## Viewing (outdated) protocol specs

The protocol specs pages are outdated, but it may still be useful to view them in some cases.

To view the protocol specs, you can run `yarn dev` or `yarn dev:local`. When viewing the protocol specs locally, versioning is disabled, so you can view the protocol specs in the browser. It would error otherwise because the protocol specs pages are not included in the pages in `versioned_docs` and `versioned_sidebars`.

## Contributing

We welcome contributions from the community. Please review our [contribution guidelines](CONTRIBUTING.md) for more information.
