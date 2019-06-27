*Notice: We have changed the Census domains. All previous Census instances are now deprecated but your data is still there. If you want to run a new Census instance please contact us through
[index@okfn.org](mailto:index@okfn.org).*

##What is the Open Data Survey?
The Open Data Survey is the tool we use to capture the information and calculate the rankings and percentages of every measuring instance. It is open source and can be reused and repurposed from its [Github repository](https://github.com/okfn/opendatasurvey/).

This tool is used to power different projects that assess data from different sources: 

* The __Global Open Data Index (GODI)__. A global assessment of the status of government open data at a national level. This is run by Open Knowledge Foundation and can be found [here](https://index.okfn.org/) 
* The __Open Data Census__, which is used to compare the progress made by different cities and local areas in releasing Open Data. The documentation found here describes how you can request and customize your own instance of the Census. You can also find the different instances of the Census that our Network and partners have used.
* Topical data projects. Projects measuring data availability for specific topics or issues. These projects don't assess open data by per se but use the Open Data Survey interface. In some of these cases the survey is only a part of a bigger project or research. 

## Why a local Open Data Census?
  
Local data is often the most relevant to citizens on a daily basis – from rubbish collection times to local tax rates.
    At the moment it's hard to know what local open data is available.
   People can help change that by reporting on the state of open data in their area with a local open data census.

## Get Started

We've created the Open Data Survey to be easily deployed. It will allow you to assess and compare the progress made by different cities and local areas in releasing Open Data. If you think the Survey can be useful for another topic, please let us know.  You can see the instances (old and new) below:

{!_includes/local_census_instances.md!}

If you don't see your country in the list or need a new instance, all you need to do is __register your interest in this form__ and we'll contact you to get your Open Data Survey set up and ready to use.

<iframe src="https://docs.google.com/forms/d/1kbASV4sc6ElLieyj009gNAGGfpMJ8pDek7zNBC52x9c/viewform?embedded=true" width="640" height="850" frameborder="0" marginheight="0" marginwidth="0">Loading&#8230;</iframe>

If you only need to deploy a new instance of your old census send us an email us to census@okfn.org. 

## FAQs

### How it Works

#### Will the Survey be hosted for me?

Yes, we'll host the census for you. If you know how to, you can re-deploy the code following the instructions in the [repository](https://github.com/okfn/opendatasurvey). 

#### Will I be able to compare cities (or regions) in my country?
 
Yes, you will. That's exactly what the local survey is intended to do!

#### Can I have separate city and region censuses for my country?

Yes. For example, for the United States you might want a census for cities and a census for the states, as both cities and states are releasing open data. However, you will need a dedicated instance for each, since comparing them in one instance is not supported in the current version of the Survey. 

#### Can I customize the list of datasets that are surveyed?

Yes, you can! The list of datasets is fully customizable. If you want to add more datasets or change the list of datasets for your local census, you can, just edit the backend. Be aware that the more datasets you add, the more screen space required for them and the more bulky your survey entries might look. Check the [site-admins](site-admins) section for more specific information. 

#### Can I configure basic information (e.g. site name and title)?

Yes, most of the basic census site information is configurable in an easy way. Check the [site-admins](/site-admins) section for more specific information.

#### Can I run a local Census across multiple countries?

Yes, that's possible – though we encourage people to focus on cities or regions within one country. If you want to learn about the state of open data in countries, we recommend you check the [Global Open Data Index][open-data-index].

#### Where can I find the list of all local censuses?

You can find it in the list of [local census instances](!includes/local_census_instances.md!). There you will find the archives and active censuses around the world.

#### Where will the Census be located Online?
Its URL will be {census-name}.survey.okfn.org. It is possible to customize this if you need the census at your URL.

### Background

#### How did this come about?

After the first edition of the Global Open Data Index people wanted to be able to customise their own Census. Local Censuses are quick to set up, since they reuse the tools we designed for the Global Open Data Index. We can help you get a Topical or Local Open Data Census set up quickly and easily, and you can select what datasets you want to survey for your survey too.

We know there is huge variability in how much local data is available not just across countries but within countries, with some cities and municipalities making major open data efforts, while in others there's little or no progress visible. If we can find out what open data is out there, we can encourage more cities to open up key information, helping businesses and citizens understand their cities and making life easier.

#### What's the relation with the Global Open Data Index?

The [Global Open Data Survey][national-open-data-census] assesses the availability of key datasets at the national level. It was run annually from 2012 to 2017 by Open Knowledge Foundation. It is used to produce the [Global Open Data Index][open-data-index], the global reference for the state of open data released by national governments.

The Index (and Census) answer questions like: which key datasets are being released? Is the available data legally and technically usable so that citizens, civil society and businesses can realise the full benefits of the information?

#### Can I do a topical Census focused on a particular topic (e.g. transport data) rather than a local census?

Yes you can! There are a couple instances running that aren't focused on a specific geographical region. [Contact us][contact-us] if you are interested.

#### Who's running this?

This site and the Open Data Census platform is run by [Open Knowledge Foundation][okf]. Each individual census is run by its specific team and community who are responsible for its content, methodology and validity.

#### This is great! Can I make a donation?

Open Knowledge Foundation is a non-profit and we appreciate any and all donations. Support the running of censuses by donating now via Paypal!

<form action="https://www.paypal.com/cgi-bin/webscr" method="post">
<input type="hidden" name="cmd" value="_s-xclick" />
<input type="hidden" name="hosted_button_id" value="CFMADP9T64XUN" />
<input type="image" src="https://www.paypalobjects.com/en_GB/i/btn/btn_donate_SM.gif" border="0" name="submit" alt="PayPal — The safer, easier way to pay online." />
<img alt="" border="0" src="https://www.paypalobjects.com/en_GB/i/scr/pixel.gif" width="1" height="1" />
</form>

#### Can I reuse the Survey platform myself?

Yes! Because the Survey is built with open source tools, you can of course help improve the Census and if you prefer to host your own version, you can do that too.

If you'd like to use these tools to run your own census, perhaps focusing on different datasets or a particular region or topic, [we'd love to hear from you][contact-us].


[contact-us]: /contact/
[okf]: https://okfn.org
[open-data-index]: http://index.okfn.org/
[national-open-data-census]: http://census.okfn.org/
