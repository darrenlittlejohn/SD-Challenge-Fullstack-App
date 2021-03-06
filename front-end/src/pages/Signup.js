import React, { Component } from 'react';
import {
  Button,
  Col,
  ControlLabel,
  FormGroup,
  FormControl,
  Row,
  Grid,
  PageHeader,
} from 'react-bootstrap'

class Signup extends Component {
  constructor(props){
    super(props)
    this.state = {
      form:{
        name: '',
        email: '',
        password: ''
      }
    }
  }


  handleChange(event){
    const formState = Object.assign({}, this.state.form)
    formState[event.target.name] = event.target.value
    this.setState({form: formState})
  }

  handleSubmit(event){
    event.preventDefault(event)
    this.props.onSubmit(this.state.form)
  }

  render(){
    return (
      <Grid className = "loginForm">
          <PageHeader>
            <Row>
              <Col xs={12}>
                Sign Up
              </Col>
            </Row>
          </PageHeader>

          <form>
              <Row>
                <Col xs={12}>
                  <FormGroup>
                    <ControlLabel id="name">Name</ControlLabel>
                    <FormControl
                      type="text"
                      name="name"
                      value={this.state.form.name}
                      onChange={this.handleChange.bind(this)}
                    />
                  </FormGroup>
                </Col>
              </Row>

              <Row>
                <Col xs={12}>
                  <FormGroup>
                    <ControlLabel id="email">Email</ControlLabel>
                    <FormControl
                      name="email"
                      value={this.state.form.email}
                      onChange={this.handleChange.bind(this)}
                    />
                  </FormGroup>
                </Col>
              </Row>
              <Row>
                <Col xs={12}>
                  <FormGroup>
                    <ControlLabel id="password">Password</ControlLabel>
                    <FormControl
                      name="password"
                      type="password"
                      value={this.state.form.password}
                      onChange={this.handleChange.bind(this)}
                    />
                  </FormGroup>
                </Col>
              </Row>
              <Row>
                <Col xs={6}>
                  <Button
                    onClick={this.handleSubmit.bind(this)}
                  id="submit" type="submit">Sign Up</Button>
                </Col>
              </Row>

          </form>
      </Grid>

    )
  }
}


export default Signup
