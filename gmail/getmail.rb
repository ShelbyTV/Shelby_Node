require 'rubygems'
require 'gmail'
require 'uri'
require 'oniguruma'

url_reg = /(?i)\b((?:https?:\/\/|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|(([^\s()<>]+|(([^\s()<>]+)))*))+(?:(([^\s()<>]+|((­[^\s()<>]+)))*)|[^\s`!()[]{};:'".,<>?«»“”‘’]))/

gmail = Gmail.new(ARGV[0], ARGV[1])
response_obj = []

emails_to_parse = gmail.inbox.emails(:after => Date.parse("2011-04-01"))
puts emails_to_parse.count
counter = 0

emails_to_parse.each do |email|
  counter+=1
  puts 'parsing email '+counter.to_s+' of '+emails_to_parse.count.to_s
  
  m = email.message.body.to_s
  f = email.message.from_addrs
  u = m.scan(url_reg)
  urls = []
  
  if u
    u.each do |el|
      if (!el.nil? && el.length>3)
        urls << el
      end
    end    
  end
  
  if urls.size
    o = {:from => f, :urls => urls, :to => ARGV[0]}
    response_obj << o
  end
  
end  

puts response_obj.count

response_obj.each do |o|
  puts o[:from]
  puts o[:urls]
  puts o[:to]
end
  
  
  
