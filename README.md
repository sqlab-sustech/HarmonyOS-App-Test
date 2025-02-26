# HarmonyOS-App-Test

This repository contains the artifacts related to model-based GUI testing for HarmonyOS apps.

## Document

### Setup

To run this project, you need the environment as follows.

#### Hardware

- **Operating System:** windows 10 64-bit or windows 11 64-bit
- **Memory:** 16 GB RAM or higher
- **Storage:** 100 GB free space or more
- **Display Resolution**: 1280x800 pixels or higher

#### Software

- **Python:** preferably version 3.x
- **Node.js:** version 16.x or higher recommended
- **[DevEco Studio](https://developer.huawei.com/consumer/cn/deveco-studio/)**: version 3.1 or 4.0 (You can install version 3.1 by **deveco-studio-3.1.0.501.exe** provided in this project.)

### Usage

Clone the project.

```bash
git clone https://github.com/sqlab-sustech/HarmonyOS-App-Test.git
```

Enter the project folder and install the necessary third-party Node.js libraries.

```bash
cd HarmonyOS-App-Test
npm install
```

Modify the value of `project` variable in `script.py` to the folder path of the HarmonyOS app you would like to test on.

Then run `script.py`.

```bash
python script.py
```

This will generate `PTG.ets`, containing a json string which represents page transition graph extracted from the HarmonyOS app project by static analysis. Open the HarmonyOS app project using DevEco Studio, such as **https://github.com/WinWang/HarmoneyOpenEye** project listed in `project.txt`. Copy `Ability.test.ets` and `PTG.ets` to the `src/ohosTest/ets/test` folder in the HarmonyOS app project.

You can choose random strategy or model-based strategy to run with. Create a Huawei Phone Emulator in DevEco Studio. Open the phone, set the total testing time and run `Ability.test.ets` with coverage. Finally you will get a `.test` folder including coverage information of testing.

![image](https://github.com/user-attachments/assets/3ca580d5-cb6d-4f8c-89a3-9136b584d347)

### Demo

The demo video for this project is available at [Model-Based GUI Testing for HarmonyOS Apps](https://www.youtube.com/watch?v=dgZWkHiBYbA).

中文视频：[模型驱动的鸿蒙应用自动化测试技术](https://www.bilibili.com/video/BV1pemTYSEd4/?spm_id_from=333.1365.list.card_archive.click)