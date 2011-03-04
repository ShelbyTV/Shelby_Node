
function removeUser(twitter_id, callback)
{ 
  var success = false;
  
  var iterator = function(stream, atomic_callback)
  {
    for (var i=0; i<stream.ids.length; i++)
    {
      if (stream.ids[i]==twitter_id)
      { 
        success = true;
        stream.ids.splice(i,1); //remove this id
        stream.stream.destroy(function()
        {
          buildStreams(stream.ids, function()
          {
              atomic_callback();          
          });  
        }); //and the el needs to be purged from full_streams 
      }
      else
      {
        atomic_callback();
      }
    }
  }
  
  util.async.forEach(full_streams, iterator, function()
  {
      util.async.forEach(partial_streams, iterator, function()
      {
        if (!success)
        {
          callback(function()
          {
            //re-add job..
          });
        }
      });
  });
  
}