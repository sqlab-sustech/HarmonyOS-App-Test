# HarmonyOS-App-Test

This repository contains the artifacts related to HarmonyOS app testing.

## Document

## Setup
To run this project, you need the environment as follows.

- Python: Ensure you have Python installed (preferably version 3.x).
- Node.js: Install Node.js (version 16.x or higher recommended).
- [DevEco Studio](https://devecostudio.huawei.com/en/): Download and install the latest version of DevEco Studio for HarmonyOS development.


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

This will generate `PTG.json`, which represents page transition graph extracted from the HarmonyOS app project by static analysis. Open the HarmonyOS app project using [DevEco Studio](https://devecostudio.huawei.com/en/). Copy the content in `PTG.json` to `PTGJson` variable in `PTG.ets`. Then copy `Ability.test.ets` and `PTG.ets` to the `src/ohosTest/ets/test` folder in the HarmonyOS app project.

You can choose random strategy or model-based strategy to run with. Create a Huawei Phone Emulator in [DevEco Studio](https://devecostudio.huawei.com/en/). Open the phone, set the total testing time and run `Ability.test.ets` with coverage. Finally you will get a `.test` folder including coverage information of testing.

![image](https://github.com/user-attachments/assets/3ca580d5-cb6d-4f8c-89a3-9136b584d347)

### Demo

The demo video for this project is available at [Model-based GUI Testing For HarmonyOS Apps](https://www.youtube.com/watch?v=dgZWkHiBYbA). 
