import { LambdaHandler } from '../lambdahandler/LambdaHandler.class'
import { IResponse } from '../lambdahandler/Response.class'
import { Context, Callback } from 'aws-lambda'


  export interface IRequest {
    accountId:string
    value:any
    indexName?:string
    view?:any
    lastEvaluatedKey?:any
  }


export abstract class ReadIsGreaterOrEqualHandler extends LambdaHandler {
    protected request:IRequest
    protected response:IResponse
    protected syntax:any


    constructor(incomingRequest:IRequest, context:Context, callback:Callback) {
      super(incomingRequest, context, callback)
    }



        protected hookConstructorPre() {
          this.requiredInputs = ['accountId', 'value']
          this.needsToConnectToDatabase = true
        }




    protected performActions() {
      this.makeInitialSyntax()
      if (this.request.indexName) this.addQueryByIndexSyntax()
      if (this.request.view) this.addProjectionSyntax()
      if (this.request.lastEvaluatedKey) this.addLastEvaluatedKeySyntax()
      this.performQuery()
    }




        protected makeInitialSyntax() {
          this.syntax = {
            TableName : `${ process.env.saasName }-${ process.env.stage }`,
            KeyConditionExpression: '#table = :table AND #index >= :value',
            ExpressionAttributeNames:{
                "#table": 'table',
                "#index": this.request.indexName || 'id'
            },
            ExpressionAttributeValues: {
                ":table": `${ this.request.accountId }.${ process.env.model }`,
                ":value": this.request.value
            }
          }
        }




        protected addQueryByIndexSyntax() {
          this.syntax.IndexName = this.request.indexName
        }




        protected addProjectionSyntax() {
          this.request.view = JSON.parse(this.request.view)
          this.syntax.ProjectionExpression = this.request.view.ProjectionExpression
          for (let [ placeholder, value ] of Object.entries(this.request.view.ExpressionAttributeNames) as any) {
            this.syntax.ExpressionAttributeNames[placeholder] = value
          }
        }




        protected addLastEvaluatedKeySyntax() {
          this.syntax.ExclusiveStartKey = JSON.parse(this.request.lastEvaluatedKey)
        }


        protected performQuery() {
          this.db.query(this.syntax).promise()
            .then(result => this.hasSucceeded(result))
            .catch(error => this.hasFailed(error))
        }

} // End Main Handler Function -------
