const FileWatch = require('./fileWatcher');

let fileWatcher = new FileWatch();
const operator = 'operatorA'
const folder = '../CDRFile/operatorA';

fileWatcher.on('file-added', log => {
  // In this step, you can do anything you want, like to push alert message to chatwork, slack...vv
  // I just print error message to console
  console.log(log.message);
});

fileWatcher.watchFolder(folder,operator);

