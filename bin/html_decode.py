import splunk.Intersplunk 
try:
    # Python 2.6-2.7 
    from HTMLParser import HTMLParser
except ImportError:
    # Python 3
    from html.parser import HTMLParser
h = HTMLParser()           
results,unused1,unused2 = splunk.Intersplunk.getOrganizedResults()
for result in results:
    result["_raw"] = h.unescape(result["_raw"])
splunk.Intersplunk.outputResults(results)