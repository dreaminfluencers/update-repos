const github = require("@actions/github");
const core = require("@actions/core");
const simpleGit = require("simple-git");
const { GetResponseDataTypeFromEndpointMethod } = require("@octokit/types");
const fs = require('fs-extra');

simpleGit().clean(simpleGit.CleanOptions.FORCE);


async function run() {
    const _repos = core.getInput('repos');
    const github_token = core.getInput('GITHUB_TOKEN');
    const versionName = core.getInput('versionName');

    const mainRepo = core.getInput('mainRepo');

    const auth = {
        username: core.getInput('USERNAME'),
        password: core.getInput('PASSWORD')
    }

    console.log('repos', _repos);
    console.log('github_token', github_token);
    console.log('versionName', versionName);
    console.log('mainRepo', mainRepo);

    const octokit = github.getOctokit(github_token);
    const context = github.context;


    fs.mkdirSync('./tmp', { recursive: true });
    const repos = _repos.split('\n');
    for(let repoPath of repos) {
        const location = repoPath.split("@")[0];
        const repoSplitted = repoPath.split('/').pop();
        const repo = repoSplitted.split('@').shift();
        const branch = repoSplitted.split('@').pop();

        console.log("repoPath", repoPath);
        console.log("location", location);
        console.log("repoSplitted", repoSplitted);
        console.log("repo", repo);
        console.log("branch", branch);

        try {
            await simpleGit().clone(`https://${auth.username}:${auth.password}@github.com/${location}.git`, `tmp/${repo}`, {
                '--branch': branch,
            });
            const packageJson = JSON.parse(fs.readFileSync("./tmp/" + repo + "/package.json", "utf8"));
            
            if(location == mainRepo) {
                console.log("Set main repo version to", versionName);
                packageJson.version = versionName;
            } else {
                console.log("Set dependency version to", packageJson.version);
                packageJson.dependencies["@dreaminfluencers/dream-framework"] = versionName;
            }

            fs.writeFileSync("./tmp/" + repo + "/package.json", JSON.stringify(packageJson, null, 4));

            //Commit and push

            await simpleGit(`./tmp/${repo}`).addConfig('user.name', 'Hundeklemmen');
            await simpleGit(`./tmp/${repo}`).addConfig('user.email', 'thehundeklemmen@gmail.com');
        
            await simpleGit(`./tmp/${repo}`).add('./package.json');
            await simpleGit(`./tmp/${repo}`).commit(`Updated dream-framework to ${versionName}`);
            await simpleGit(`./tmp/${repo}`).push(['-u', 'origin', branch, '--force']);

        } catch(e) {
            console.log(e);

        }
    }

}
run();