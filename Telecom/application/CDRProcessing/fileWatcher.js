'use strict';

const chokidar = require('chokidar');
const EventEmitter = require('events').EventEmitter;
const fs = require('fs');
const fileProcessor = require('./fileProcessor');
const path = require('path');


//const readLastLines = require('read-last-lines');

class fileWatcher extends EventEmitter {
  constructor() {
    super();
  }

  watchFolder(folder,operator) {
    try {
      console.log(
        `[${new Date().toLocaleString()}] Watching for folder changes on for operator ${operator}: ${folder}`
      );

      var watcher = chokidar.watch(folder, { persistent: true , awaitWriteFinish: true});

      watcher.on('add', async filePath => {
          console.log(
            `[${new Date().toLocaleString()}] ${filePath} has been added.`
          );
          await fileProcessor.processFile(filePath,operator).then(()=>{

           fs.rename(filePath,"../archive/"+operator+"/"+path.basename(filePath)+"_"+Date.now());
          });
          
/*
          // Read content of new file
          var fileContent = await fsExtra.readFile(filePath);

          // emit an event when new file has been added
          this.emit('file-added', {
            message: fileContent.toString()
          });   */      
        
      });
    } catch (error) {
      console.log(error);
    }
  }

}

module.exports = fileWatcher;
