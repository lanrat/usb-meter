# [USB BLE Power Meter](https://lanrat.github.io/usb-meter/)

[lanrat.github.io/usb-meter](https://lanrat.github.io/usb-meter/)

## Information

This webapp makes use of [WebBluetooth](https://web.dev/bluetooth/) to read data
from the cheap Atorch power meters. Any web browser with WebBluetooth support
should work, including Chrome based browsers on desktop and Android.

## Screenshots

<img width="846" alt="screenshot" src="https://user-images.githubusercontent.com/164192/192336525-22cdd0de-6e44-452f-af97-06c34b4559b4.png">

### Hardware

![image](https://user-images.githubusercontent.com/164192/192333803-254ac224-3aea-4b4d-8908-5ecca27195f1.png)

This should work with most of the power meters made by Atorch. It has only been
tested with the USB version, but the others should work too. (pull requests welcome).

This should work with any hardware that is supported by the
[E-test](https://play.google.com/store/apps/details?id=com.tang.etest.e_test) app.

The specific model used for development was the `Atorch J7-C`, purchased [here](https://www.aliexpress.com/item/3256802185219181.html).

## References

* <https://github.com/NiceLabs/atorch-console/blob/master/docs/protocol-design.md>
* <https://github.com/syssi/esphome-atorch-dl24>
