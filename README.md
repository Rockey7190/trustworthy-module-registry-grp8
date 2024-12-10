# README

Overview
The Package Management System is a backend service that provides a robust REST API for managing software packages. It supports functionality for uploading, updating, downloading, searching, and deleting packages, as well as advanced features like cost analysis and registry reset. The system is built with Node.js, Express, and leverages AWS services such as S3 for cloud storage of package files, beanstalk for API server, and database.

**Front End Website link:**
https://rockey7190.github.io/trustworthy-module-registry-grp8/
**Server link for endpoint access:**
http://dev-new-env.us-east-2.elasticbeanstalk.com

**Valid Endpoints**

**Feature**                                **Relevant Endpoint(s)**                           **Verb(s) | Payload option(s)** 

Upload Packages                             /package                                           POST | Valid input with Content (base64) or URL, and Name 

Fetching Packages                           /packages                                          POST | Valid array of queries (Name, Version, or "*") 

Deleting Package Versions                   /delete                                            DELETE | Valid input with packageName, version 

Fetching Available Versions                 /versions                                          GET | Valid input with packageName, optional versionRange 

Fetching Package Directory                  /package/{id}                                      GET | Path parameter id 

Updating Package                            /package/{id}                                      POST | Valid Content (base64), Version, and id 

Getting Package Cost                        /package/{id}/cost                                 GET | Path parameter id, query dependency=true/false 

Getting Ratings                             /package/{id}/rate                                 POST | No input 

Downloading Packages                        /download                                          GET | Valid input with packageName, optional version 

Fetching Tracks                             /tracks                                            GET | No payload required 

Searching by RegEx                          /package/byRegEx                                   POST | Payload with RegEx 

Full Reset                                  /reset                                             DELETE | No input 

authenticate                                /authenticate                                      POST | username and password 

delete                                      /delete/:id                                        DELETE | takes user_id 

Fetch users                                 /users                                             GET | No input 

Fetch user                                  /user/:id                                          GET | takes id 

register                                    /register                                          POST | payload 


**Testing**
To test endpoints use curl commands or a tool like postman
