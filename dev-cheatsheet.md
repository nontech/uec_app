# To deploy web app
- Run `npm run predeploy` to export the web app
- Run `npm run deploy` to deploy the web app
*Note: This below steps are needed because the assets folder is being ignored by github*
- Copy the contents of the assets folder and (later) paste it into the root of the gh-pages branch
- checkout the gh-pages branch
- pull the changes with 'git pull'
- paste the assets folder contents into the root of the gh-pages branch
- add and commit the changes with 'git add -f assets/' and 'git commit -m "deploy"'
- push the changes with 'git push'
- check github actions to make sure the deploy worked
- The web app should be deployed to https://urbaneatsclub.com/


# To run the app locally
- Run `npm start` to start the app

# To run the supabase functions locally
- go to the supabase/functions folder
- run `supabase functions serve` to start the functions


# To build the app on android and ios
- install eas-cli: `npm install -g eas-cli`
- run `eas login` to login to eas
- run `eas build:configure` to configure the build
For production builds:
- Before building, run `npx expo prebuild --platform [android|ios]` to ensure the app is up to date
- run `eas build --platform [android|ios]` to build the app for the specified platform
For preview builds:
- Configure preview build profile in eas.json
    - in eas.json, under the build object, create a new profile with the following:
       {
            "build": {
                "preview": {
                "distribution": "internal"
                }
            }
        }

To download for android:
- run `eas build --platform android --profile preview` to build the app for the specified platform







