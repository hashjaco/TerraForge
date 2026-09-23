use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ElementType {
    Lane,
    Shoulder,
    Curb,
    Sidewalk,
    Slope,
    Ditch,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum Side {
    Left,
    Right,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TemplateElement {
    pub element_type: ElementType,
    pub width: f64,
    pub slope: f64,
    pub side: Side,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Template {
    pub name: String,
    pub elements: Vec<TemplateElement>,
}

impl Template {
    pub fn basic_road() -> Self {
        Self {
            name: "Basic Two-Lane Road".into(),
            elements: vec![
                TemplateElement {
                    element_type: ElementType::Lane,
                    width: 3.65,
                    slope: -0.02,
                    side: Side::Left,
                },
                TemplateElement {
                    element_type: ElementType::Lane,
                    width: 3.65,
                    slope: -0.02,
                    side: Side::Right,
                },
                TemplateElement {
                    element_type: ElementType::Shoulder,
                    width: 1.5,
                    slope: -0.04,
                    side: Side::Left,
                },
                TemplateElement {
                    element_type: ElementType::Shoulder,
                    width: 1.5,
                    slope: -0.04,
                    side: Side::Right,
                },
                TemplateElement {
                    element_type: ElementType::Slope,
                    width: 3.0,
                    slope: -0.33,
                    side: Side::Left,
                },
                TemplateElement {
                    element_type: ElementType::Slope,
                    width: 3.0,
                    slope: -0.33,
                    side: Side::Right,
                },
            ],
        }
    }
}

impl TemplateElement {
    /// Returns the (offset, elevation_delta) for this element relative to the centerline.
    pub fn cross_section_point(&self, start_offset: f64) -> (f64, f64) {
        let sign = match self.side {
            Side::Left => -1.0,
            Side::Right => 1.0,
        };
        let end_offset = start_offset + sign * self.width;
        let elev_delta = self.slope * self.width;
        (end_offset, elev_delta)
    }
}
