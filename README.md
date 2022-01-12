# kijs-sticky
A plugin add sticky for kijs (like jQuery-sticky)
[View docs](https://tachibana-shin.github.io/kijs-sticky)

[![Build](https://github.com/tachibana-shin/kijs-sticky/actions/workflows/docs.yml/badge.svg)](https://github.com/tachibana-shin/kijs-sticky/actions/workflows/docs.yml)
[![NPM](https://badge.fury.io/js/kijs-sticky.svg)](http://badge.fury.io/js/kijs-sticky)

## Installation
NPM / Yarn:
``` bash
yarn add kijs-sticky
```

CDN:
``` html
<script src="https://unpkg.com/kijs-sticky"></script>
```

## Example
``` ts
// your example
import kijs, { use } from "kijs";
import Sticky from "kijs-sticky";

use(Sticky);

kijs(".install-button").sticky();
```