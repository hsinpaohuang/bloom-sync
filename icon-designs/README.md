# Icon designs for this extension

Created from redesigns of [Material Icons](https://fonts.google.com/icons) by Google.

Edited with [Pixlr](https://pixlr.com/)

Resized with Quasar's [Icon Genie](https://quasar.dev/icongenie/introduction)

## Edit Icons

To load the previously edited file, simply open the `.pxz` file in Pixlr's editor: [https://pixlr.com/editor/](https://pixlr.com/editor/)

Once complete with the edit, resize it with Icon Genie

First, install the CLI by following the [instructions](https://quasar.dev/icongenie/installation):

```bash
yarn global add @quasar/icongenie
```

(Yes, this project mainly uses bun. But Icon Genie installed with bun will throw an error as of this writing, so use yarn to install it instead)

Edit the `.json` files in this directory as needed, then run the following command:

```bash
icongenie generate -p icon-designs
```

**WARNING: It will overwrite the previous file with the same name.**
