<a name="readme-top"></a>

<!-- -------------------------------------------------------------------------- -->
<!-- HEADING STUFF  -->
<div>
<div align="center">
  <h2>British Computer Society Capstone Project</h2>
  <h4>Inception_AI<h4>
  <h3> 
    <a href='https://saa-s-ai-platform-with-chat-gpt-integration.vercel.app//' target='_blank'>
      <h5>live demo ↗</h5>
    </a>
  </h3>
  <p align="center">
    <h4>To see the steps i took to build the project see the Project-Khan-Board Below <h4>
    <a href="https://github.com/users/mutaremalcolm/projects/12/views/1">Project Khan Board</a>
    &nbsp;·&nbsp;
    <!-- <a href="https://github.com/yourusername/thymia-take-home/issues">Request Feature</a> -->
  </p>


<!-- -------------------------------------------------------------------------- -->

### 👋 Introduction:
</div>
---

Inception AI is a SaaS platform leveraging ChatGPT to deliver advanced AI functionalities through a user-friendly interface. Designed to streamline workflows and boost productivity, the platform integrates five core AI tools, providing both free and paid tiers to meet various user needs.

## Project Objectives

- **Craft a fully functional and responsive web application**: Built with React and Tailwind CSS for a seamless experience across devices.
- **Implement secure user authentication**: Utilizing Clerk to ensure data privacy and access control.
- **Integrate the ChatGPT API**: For AI-driven text summarization, content creation, sentiment analysis, code generation, and translation.
- **Persistently store user data**: Using Prisma and MySQL for reliable data management.
- **Deliver a deployed prototype**: Hosted on platforms like Vercel.
- **Establish a Kanban board on GitHub**: For transparent development tracking and documentation.


<br/>

## Technology Stack

- **Frontend**: React, Tailwind CSS
- **API Integration**: ChatGPT API
- **Backend**: Next.js 14, Prisma, MySQL
- **Authentication**: Clerk
- **Project Management**: GitHub Project Khan Board
- **Payments**: Stripe

## Offering Both Free and Paid Tiers

The platform will offer a free tier with limited access and a paid tier that unlocks all five AI tools. Stripe will be integrated for secure and reliable payment processing.

<br/>

<details>
  <summary>Read more about Methodology</summary>

## Methodology

An agile approach will guide the project with iterative sprints and user feedback:
- **Requirement Analysis**: Define user needs and functionalities.
- **Prototype Development**: Build a basic prototype for feedback.
- **API Integration**: Integrate ChatGPT API calls.
- **Authentication Implementation**: Secure user management with Clerk.
- **Data Persistence**: Set up Prisma and MySQL.
- **Testing and Refinement**: Thorough testing and feedback integration.
- **Deployment and Documentation**: Deploy the final prototype and prepare documentation.

</details>

## Deliverables

- **Functional SaaS AI Platform**: With free and paid tiers.
- **User Documentation**: Guides and tutorials.
- **Project Khan Board**: Detailed development process.
- **Source Code**: With clear comments and explanations.
- **Presentation**: Showcasing goals, achievements, and future potential.

## Conclusion

Inception AI aims to democratize advanced AI functionalities through a user-friendly platform. By integrating ChatGPT and using innovative technologies, the project enhances user productivity and offers flexible pricing, showcasing strong technical expertise and aligning with Capstone objectives.

## **Known Issues**  

The video and audio generation models have occasionally been observed to take an extended time to produce content in deployment. As a result, API requests may time out before a response is received.  

To mitigate this, a `vercel.json` file was introduced to extend the API call timeout to **300 seconds**. The root cause of the delay appears to be that the model generation engine sometimes starts in a **cold state**, requiring additional time to warm up before producing content.  

---

## **Upcoming Improvements**  

To further enhance reliability, a **polling-based solution** will be implemented. This approach will ensure more consistent API responses while preventing timeouts. However, it requires refactoring the following components:  

- **API Endpoint:** Adjustments to support polling logic.  
- **Loader Component:** Introduction of a new component to handle real-time status updates.  
- **UI Updates:** Enhancements to display loading states and final results more effectively.  

### **Expected Benefits:**  
✅ More reliable API calls.  
✅ Improved user experience with real-time status updates.  
✅ Elimination of timeouts.  
✅ Better compatibility with a serverless architecture.  

A ticket has been created in the project Kanban to track the implementation of these improvements.  


</div>

<!-- -------------------------------------------------------------------------- -->
<p align="right">(<a href="#readme-top">back to top</a>)</p>


